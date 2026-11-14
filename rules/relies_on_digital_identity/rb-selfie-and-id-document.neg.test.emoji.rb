# lexcode-expect: 0
# Emoji tables keyed by name: a selfie and an identification card sit beside each other as
# emoji, and no image is held. Symbol keys, string keys and rocket symbol keys.

module Emoji
  BY_SHORT_NAME = {
    grinning: "1F600",
    smiley: "1F603",
    selfie: "1F933",
    identification_card: "1FAAA",
  }.freeze

  BY_NAME = {
    "grinning_face" => { unified: "1F600" },
    "selfie" => { unified: "1F933" },
    "identification_card" => { unified: "1FAAA" },
  }.freeze

  LEGACY = {
    :grinning => "1F600",
    :selfie => "1F933",
    :identification_card => "1FAAA",
  }.freeze
end
