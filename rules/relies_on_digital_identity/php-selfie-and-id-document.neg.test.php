<?php
// lexcode-expect: 0
// A face image alone, an identity document alone, and the two in separate lists, none of which is
// a document-and-selfie check: a profile selfie, a supplier's registration document, a container's
// liveness probe, and a face photo validated in one request and an ID card in another.

namespace App\Http\Requests;

use Illuminate\Http\Request;

class ProfileRequest
{
    public function rules(): array
    {
        return ['selfie' => 'nullable|image|max:4096', 'display_name' => 'required|string'];
    }
}

class SupplierRequest
{
    public function rules(): array
    {
        return ['id_document' => 'required|file', 'company_name' => 'required|string'];
    }
}

class Deployment
{
    public function container(): array
    {
        return [
            'livenessProbe' => ['httpGet' => ['path' => '/healthz']],
            'image' => 'app:latest',
            'document_root' => '/var/www',
        ];
    }
}

class Uploads
{
    public function avatar(Request $request): array
    {
        return $request->validate(['face_photo' => 'required|image']);
    }

    public function badge(Request $request): array
    {
        return $request->validate(['id_card' => 'required|image']);
    }

    public function fields(): array
    {
        $profile = ['selfie_caption', 'bio'];
        $documents = ['passport_number', 'document_type'];
        return [$profile, $documents];
    }
}
