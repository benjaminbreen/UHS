
type TimeOfDay = 'Predawn' | 'Dawn' | 'Morning' | 'Midday' | 'Afternoon' | 'Late Afternoon' | 'Golden Hour' | 'Dusk' | 'Late Twilight' | 'Early Evening' | 'Night';

export const AMBIANCE_TIMEOFDAY_FRAGMENTS: Record<TimeOfDay, string[]> = {
  Predawn: [
    "The darkness begins to soften with the first hint of dawn.",
    "A deep stillness pervades the quiet hours before sunrise.",
    "The world sleeps in the last moments before daybreak."
  ],
  Dawn: [
    "The first light of dawn paints the sky.",
    "The world awakens as darkness recedes.",
    "A cool mist hangs in the early morning air.",
    "It is a beautiful dawn."
  ],
  Morning: [
    "The sun climbs higher.",
    "Morning dew glitters.",
    "The day begins."
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
  "Late Afternoon": [
    "The sun grows lower and the light becomes warmer.",
    "Shadows lengthen as the day progresses.",
    "The afternoon heat begins to fade."
  ],
  "Golden Hour": [
    "The sun bathes everything in warm, golden light.",
    "The magic hour casts a honeyed glow across the land.",
    "The world seems to shimmer in the golden evening light."
  ],
  Dusk: [
    "The sky is awash with the colors of sunset.",
    "Twilight settles over the land.",
    "The first stars begin to appear."
  ],
  "Late Twilight": [
    "The last light fades from the western sky.",
    "Deep purple shadows creep across the landscape.",
    "The boundary between day and night blurs."
  ],
  "Early Evening": [
    "The evening air grows cool and peaceful.",
    "Lanterns and torches begin to flicker to life.",
    "Night creatures stir as darkness deepens."
  ],
  Night: [
    "Darkness has fallen, and the moon casts a pale light.",
    "The night is filled with the sounds of unseen creatures.",
    "A canopy of stars glitters in the inky sky."
  ],
};
