# lexcode-expect: 0
# Encrypting only access-control data is authentication, not confidentiality
# (15 C.F.R. 772.1): one-time and two-factor secrets, recovery codes, sign-in
# and API tokens, API keys, session data, a PIN and a login code, alone or
# together, with options and in parentheses.
class User < ApplicationRecord
  encrypts :otp_secret
  encrypts :two_factor_secret, :otp_backup_codes
  encrypts :totp_seed, deterministic: true
  encrypts :mfa_recovery_codes
  encrypts(:login_code)
  encrypts :code
  encrypts :remember_token, :session_data
  encrypts :twoFactorSecret
end

class Integration < ApplicationRecord
  has_encrypted :api_key, :webhook_secret, type: :string
  attr_encrypted :api_secret, key: ENV.fetch("ATTR_ENCRYPTED_KEY")
  attr_encrypted :access_token, key: ENV.fetch("ATTR_ENCRYPTED_KEY")
  encrypts :card_pin, :password_reset_nonce
end
