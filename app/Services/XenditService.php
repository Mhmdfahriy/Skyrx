<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class XenditService
{
    protected $secretKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('xendit.secret_key');
        $this->baseUrl = 'https://api.xendit.co';
    }

    public function createInvoice($data)
    {
        try {
            $params = [
                'external_id' => $data['external_id'],
                'amount' => $data['amount'],
                'payer_email' => $data['payer_email'],
                'description' => $data['description'],
                'invoice_duration' => 86400,
                'success_redirect_url' => config('app.frontend_url') . '/payment/success',
                'failure_redirect_url' => config('app.frontend_url') . '/payment/failed',
                'currency' => 'IDR',
            ];

            if (isset($data['items'])) {
                $params['items'] = $data['items'];
            }

            $response = Http::withBasicAuth($this->secretKey, '')
                ->timeout(30)
                ->post($this->baseUrl . '/v2/invoices', $params);

            if ($response->failed()) {
                Log::error('Xendit API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Xendit API Error: ' . $response->body());
            }

            $result = $response->json();
            
            return [
                'id' => $result['id'],
                'invoice_url' => $result['invoice_url'],
                'external_id' => $result['external_id'],
                'status' => $result['status'],
                'amount' => $result['amount'],
            ];
        } catch (\Exception $e) {
            Log::error('Create Invoice Error', [
                'message' => $e->getMessage()
            ]);
            throw new \Exception('Failed to create invoice: ' . $e->getMessage());
        }
    }

    public function getInvoice($invoiceId)
    {
        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->timeout(30)
                ->get($this->baseUrl . '/v2/invoices/' . $invoiceId);

            if ($response->failed()) {
                Log::error('Get Invoice Error', [
                    'invoice_id' => $invoiceId,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Xendit API Error: ' . $response->body());
            }

            $result = $response->json();
            
            return [
                'id' => $result['id'],
                'status' => $result['status'],
                'external_id' => $result['external_id'],
                'amount' => $result['amount'],
                'paid_at' => $result['paid_at'] ?? null,
                'invoice_url' => $result['invoice_url'],
            ];
        } catch (\Exception $e) {
            Log::error('Get Invoice Error', [
                'invoice_id' => $invoiceId,
                'message' => $e->getMessage()
            ]);
            throw new \Exception('Failed to retrieve invoice: ' . $e->getMessage());
        }
    }
}