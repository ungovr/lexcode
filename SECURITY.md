# Security

Please report a security problem in lexcode to security@ungovr.org rather
than in a public issue.

lexcode reads a repository on the machine it runs on and writes a record
there. It sends nothing anywhere. Its one network call is the download of the
pinned engine binary on first use, which is checked against a sha256 shipped
in the package before it is ever run.
