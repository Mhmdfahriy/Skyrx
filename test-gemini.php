<?php

$apiKey = 'AIzaSyDFUPeJxOSt5r34IrJwxpExGhFMcoPoHpY';

// List semua model yang tersedia
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "=================================\n";
echo "HTTP Code: $httpCode\n";
echo "=================================\n";
echo $response . "\n\n";

if ($httpCode == 200) {
    $json = json_decode($response, true);
    
    if (isset($json['models'])) {
        echo "✅ Available Models:\n";
        echo "=================================\n";
        foreach ($json['models'] as $model) {
            echo "Name: " . $model['name'] . "\n";
            if (isset($model['supportedGenerationMethods'])) {
                echo "Methods: " . implode(', ', $model['supportedGenerationMethods']) . "\n";
            }
            echo "---\n";
        }
    }
} else {
    echo "❌ Failed to get models\n";
}

curl_close($ch);

echo "\n=================================\n";
echo "Testing with gemini-2.0-flash-exp\n";
echo "=================================\n";

// Test dengan model alternatif
$testUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={$apiKey}";

$data = [
    'contents' => [
        [
            'parts' => [
                ['text' => 'Halo, siapa kamu? Jawab singkat dalam bahasa Indonesia.']
            ]
        ]
    ]
];

$ch2 = curl_init($testUrl);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);

$response2 = curl_exec($ch2);
$httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);

echo "HTTP Code: $httpCode2\n";
echo "Response: $response2\n\n";

if ($httpCode2 == 200) {
    $json2 = json_decode($response2, true);
    if (isset($json2['candidates'][0]['content']['parts'][0]['text'])) {
        echo "✅ SUCCESS with gemini-2.0-flash-exp!\n";
        echo $json2['candidates'][0]['content']['parts'][0]['text'] . "\n";
    }
}

curl_close($ch2);