/**
 * The single place to personalize the birthday gift.
 * Keep the passcode private if the project is published.
 */
export const giftConfig = {
  friendName: "Fati",
  passcode: "2610",
  // Add an MP3 under public/music/ and set this value, for example: "/music/birthday.mp3".
  musicPath: "",
  // Add or replace paths here. Files currently live in public/images/.
  albumPhotos: ["/images/fati.jpg", "/images/fati1.jpg"],
  // This card opens after she makes her wish. Personalize it with your own words.
  wishMessage: "Que chaque souhait que tu portes trouve son chemin vers toi, et que cette nouvelle année soit aussi belle, douce et lumineuse que ton cœur.",
  wishSignature: "Avec toute mon amitié et mes meilleurs vœux 🩷",
  letter: `**À toi, Ghzela,**

Je te souhaite une année remplie de joie, de rires et de toutes ces petites choses qui rendent la vie plus belle. J'espère que chaque matin t'apportera une nouvelle raison de sourire et que les jours à venir seront remplis de belles surprises.

**Nti katstahli kolchi zwin f had denya.** 🩷

Nchallah had l3am yjib lik ghir lkhir, lfar7a w tawfi9 f kolchi li katmenny. W ila kano chi ayam s3ab, matnsaych belli dima kayn lkhir jay, 7ta ila ma ban likch daba.

Qu'Allah t'accorde le meilleur, apaise ton cœur et t'ouvre des portes qui te mèneront vers tout ce que tu mérites.

De la Tunisie au Maroc, cette petite surprise est une façon de te souhaiter un merveilleux anniversaire et de te rappeler que tu mérites plein de belles choses.

**Joyeux anniversaire, a zwina !** 🎂🦋`,
  secondLetter: `Nchallah had l3am ykoun zwin 3lik, w t3ichi fih des moments li yfer7o 9albek, t3arfi fih nas zwinin, w tsaybi des souvenirs li yb9aw m3ak dima. 🩷

W ila chi nhar 7ssiti brassek mday9a, wala bghiti ghir thadri chwia, tdh7ki, wala tbeddli ljaw, **rah t9dri thadri m3aya bla ma t7essi b chi pression.** 

Même si la Tunisie et le Maroc nous séparent, j'espère que cette petite surprise te fera sourire et rendra ta journée un peu plus spéciale.

**Kol 3am w nti bkhir, w nchallah tchoufi ghir ma katmenny.** 💜`,
  colors: {
    blush: "#fce5e7",
    coral: "#fa9b99",
    rose: "#e96f7f",
    plum: "#5e3447",
    cream: "#fff9f5",
  },
} as const;
