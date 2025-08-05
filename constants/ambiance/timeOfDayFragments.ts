
type TimeOfDay = 'Dawn' | 'Morning' | 'Midday' | 'Afternoon' | 'Dusk' | 'Night';

export const AMBIANCE_TIMEOFDAY_FRAGMENTS: Record<TimeOfDay, string[]> = {
  Dawn: [
    "The first light of dawn paints the sky.",
    "The world awakens as darkness recedes.",
    "A cool mist hangs in the early morning air."
  ],
  Morning: [
    "The sun climbs higher, warming the land.",
    "Morning dew glitters on the ground.",
    "The day begins with a sense of activity."
  ],
  Midday: [
    "The sun is high in the sky.",
    "The heat of midday radiates from the ground.",
    "Shadows are short under the noonday sun."
  ],
  Afternoon: [
    "The afternoon sun begins its descent.",
    "Long shadows stretch across the landscape.",
    "A gentle breeze offers some respite from the day's heat."
  ],
  Dusk: [
    "The sky is awash with the colors of sunset.",
    "Twilight settles over the land.",
    "The first stars begin to appear."
  ],
  Night: [
    "Darkness has fallen, and the moon casts a pale light.",
    "The night is filled with the sounds of unseen creatures.",
    "A canopy of stars glitters in the inky sky."
  ],
};
