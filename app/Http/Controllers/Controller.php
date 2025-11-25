<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *      version="1.0.0",
 *      title="Skyrx E-Commerce",
 *      description="API Documentation untuk Skyrx E-Commerce Platform",
 *      @OA\Contact(
 *          email="skyrxstore@gmail.com"
 *      )
 * )
 *
 * @OA\Server(
 *      url=L5_SWAGGER_CONST_HOST,
 *      description="API Server"
 * )
 *
 * @OA\SecurityScheme(
 *      securityScheme="sanctum",
 *      type="apiKey",
 *      in="header",
 *      name="Authorization",
 *      description="Enter token in format: Bearer {token}"
 * )
 *
 * @OA\Tag(name="Authentication", description="Authentication endpoints")
 * @OA\Tag(name="Products", description="Product management")
 * @OA\Tag(name="Orders", description="Order management")
 * @OA\Tag(name="Profile", description="User profile management")
 * @OA\Tag(name="Chat", description="AI Chat with Gemini")
 * @OA\Tag(name="Payment", description="Payment methods")
 * @OA\Tag(name="Password Reset", description="Password reset with OTP")
 * @OA\Tag(name="Social Auth", description="Google OAuth")
 */
abstract class Controller
{
    //
}