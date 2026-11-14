<?php
// lexcode-expect: 5
// A face or selfie image held beside an image of a photo ID: a form request's validation rules, a
// controller's inline validation, a model's fillable columns, and API payloads in snake case and camel case.

namespace App\Kyc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Request;

class VerifyIdentityRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'id_document_front' => 'required|image|max:8192',
            'id_document_back' => 'nullable|image|max:8192',
            'selfie' => 'required|image|max:8192',
        ];
    }
}

class VerificationController
{
    public function store(Request $request): array
    {
        return $request->validate([
            "liveness_capture" => ['required', 'file'],
            "passport_image" => ['required', 'file'],
        ]);
    }
}

class IdentityCheck extends Model
{
    protected $fillable = ['user_id', 'face_image_path', 'drivers_license_front_path', 'status'];
}

class Submission
{
    public function payload(string $face, string $document): array
    {
        return ['selfie_image' => base64_encode($face), 'document_front' => base64_encode($document)];
    }

    public function camelCase(string $face, string $card): array
    {
        return ['faceImage' => $face, 'idCard' => $card];
    }
}
