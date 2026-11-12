<?php
// lexcode-expect: 0
// A PDF built with TCPDF and never signed, and TCPDF clearing its signature settings with empty
// arguments (as the library does on reset), so the TCPDF guard alone switches nothing on.

namespace App\Reports;

use TCPDF;

class Certificate extends TCPDF
{
    public function render(string $name): string
    {
        $this->AddPage();
        $this->Write(0, $name);
        $this->setSignature('', '', '', '', 0, array());
        return $this->Output('certificate.pdf', 'S');
    }
}
