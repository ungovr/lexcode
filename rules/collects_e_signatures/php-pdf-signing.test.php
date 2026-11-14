<?php
// lexcode-expect: 4
// Applying a digital signature to a PDF with a key: TCPDF (imported, aliased, fully qualified and
// subclassed) and SetaPDF-Signer.

namespace App\Signing;

use TCPDF;
use TCPDF as Pdf;

class SignedContract extends TCPDF
{
    public function sign(string $certificate, string $key, string $password): void
    {
        $this->setSignature($certificate, $key, $password, '', 2, ['Name' => 'Example Ltd']);
    }
}

class Exports
{
    public function aliased(string $certificate): string
    {
        $pdf = new Pdf();
        $pdf->setSignature($certificate, $certificate, 'secret');
        return $pdf->Output('signed.pdf', 'S');
    }

    public function qualified(string $certificate): string
    {
        $pdf = new \TCPDF('P', 'mm', 'A4');
        $pdf->setSignature(
            $certificate,
            $certificate,
            'secret',
        );
        return $pdf->Output('signed.pdf', 'S');
    }

    public function seta(object $document, object $module): void
    {
        $signer = new \SetaPDF_Signer($document);
        $signer->setReason('Agreement');
        $signer->sign($module);
    }
}
