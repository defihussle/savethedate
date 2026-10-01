// Everything couple-specific lives here. Edit this file and the whole site updates.

export const WEDDING = {
  partner1: 'Omer',
  partner2: 'Olivia',
  initial1: 'O',
  initial2: 'O',

  // Shown under "Save the Date" and on the printed strip caption.
  dateShort: '17.07.27',

  // The countdown runs to the start of this day in the guest's own time zone,
  // and shows "Today's the Day" from then on.
  weddingDate: '2027-07-17',

  // Photo-booth photos, top to bottom. Colour photos are fine — the site renders
  // them in black & white. Landscape crops around 7:6 fit best.
  boothPhotos: ['/photos/booth-1.jpg', '/photos/booth-2.jpg', '/photos/booth-3.jpg'],
};

// The Save the Date strip uses the same three photos.
WEDDING.heroPhotos = WEDDING.boothPhotos;
WEDDING.stripCaption = `${WEDDING.partner1} + ${WEDDING.partner2} • ${WEDDING.dateShort}`;
