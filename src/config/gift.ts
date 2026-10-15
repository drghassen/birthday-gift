/**
 * The single place to personalize the birthday gift.
 * Keep the passcode private if the project is published.
 */
export const giftConfig = {
  friendName: "Fati",
  passcode: "2004",
  // Add an MP3 under public/music/ and set this value, for example: "/music/birthday.mp3".
  musicPath: "",
  // Add or replace paths here. Files currently live in public/images/.
  albumPhotos: ["/images/fati.jpg", "/images/fati1.jpg"],
  // This card opens after she makes her wish. Personalize it with your own words.
  wishMessage: "May every wish you carry find its way to you, and may this new year be as beautiful, gentle, and bright as your heart.",
  letter: `À la plus belle des amies,

Je te souhaite une année pleine de joie, de rires, et de toutes les choses que tu aimes. Je souhaite que chaque matin, le soleil brille sur ton cœur avec sérénité, et que chaque nouveau jour t'apporte une petite raison de sourire.

Sache que tu es plus forte que tu ne le penses, et que les jours difficiles ne sont pas la fin, mais le début de quelque chose de beau. Qu'Allah t'écrive le bien où qu'il soit, et t'ouvre des portes que tu n'imaginais même pas.

De la Tunisie au Maroc, c'est une petite surprise pour te dire : joyeux anniversaire ma belle amie 🦋`,
  secondLetter: `Et inchallah cette année sera belle, avec beaucoup de rires, beaucoup de belles choses, et beaucoup de souvenirs dont tu te souviendras.

Et si un jour tu te sens seule... sache qu'il y a quelqu'un en Tunisie qui pense à toi. 😏🦋`,
  colors: {
    blush: "#fce5e7",
    coral: "#fa9b99",
    rose: "#e96f7f",
    plum: "#5e3447",
    cream: "#fff9f5",
  },
} as const;
