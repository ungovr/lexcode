// lexcode-expect: 0
using System.Security.Cryptography.X509Certificates;

namespace MyShop.Certificates;

// A file that imports only a namespace beneath System.Security.Cryptography (certificates), with the
// app's own class whose methods carry a symmetric algorithm's names: the encryptor names are read only
// where System.Security.Cryptography itself is in scope.
public class Scrambler
{
    public Scrambler CreateEncryptor() => this;
    public byte[] EncryptCbc(byte[] data, byte[] iv) => data;
}

public class Loader
{
    public X509Certificate2 Load(string path, Scrambler scrambler)
    {
        scrambler.CreateEncryptor();
        scrambler.EncryptCbc(new byte[1], new byte[1]);
        return X509CertificateLoader.LoadCertificateFromFile(path);
    }
}
