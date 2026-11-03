// The pop-up pictures for every page of the Living City book, chosen by hand
// so each one literally matches its sentence (built by
// tools/build_living_city_scenes.mjs). Per lesson: postcard (backdrop key in
// assets/story; postcardNew = not drawn yet, the section backdrop stands in),
// world (props behind, for the lesson's situation) and pages[i].props (what
// sentence i shows). A prop is {art, say?, size?, count?}; art not drawn yet
// simply doesn't appear. See docs/LIVING_CITY_ART_PROMPTS.md.
window.BOOK_SCENES = {
 "l0-a": {
  "postcard": "bg-street",
  "world": [
   {
    "art": "house",
    "say": "いえ"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "house",
      "say": "いえ"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "house-blue",
      "say": "いえ"
     }
    ]
   }
  ]
 },
 "l0-ka": {
  "postcard": "bg-street",
  "world": [
   {
    "art": "station",
    "say": "えき"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "bigface",
      "say": "かお",
      "size": "big"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "redface",
      "say": "かお"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "station",
      "say": "えき",
      "size": "big"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "pond",
      "say": "いけ",
      "size": "big"
     }
    ]
   }
  ]
 },
 "l0-sa": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "sushi",
      "say": "すし"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "cow",
      "say": "うし",
      "size": "big"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "globe",
      "say": "せかい",
      "size": "big"
     }
    ]
   }
  ]
 },
 "l0-ta": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "clock-expensive",
      "say": "とけい"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "octopus",
      "say": "たこ",
      "size": "small"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "hand",
      "say": "て",
      "size": "small"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "octopus-dish",
      "say": "たこ"
     }
    ]
   }
  ]
 },
 "l0-na": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "cat-paw",
      "say": "あし"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "dogface",
      "say": "かお"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "cat-paw",
      "say": "て"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "doghouse",
      "say": "いえ"
     }
    ]
   }
  ]
 },
 "l0-ha": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "redflower",
      "say": "はな"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "boat",
      "say": "ふね",
      "size": "big"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "star",
      "say": "ほし",
      "size": "small",
      "count": 3
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "chopsticks",
      "say": "はし",
      "size": "small"
     }
    ]
   }
  ]
 },
 "l0-ma": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "sea",
      "say": "うみ"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "town",
      "say": "まち",
      "size": "small"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "peach",
      "say": "もも"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "shop",
      "say": "みせ",
      "size": "small"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "eyes",
      "say": "め",
      "size": "big"
     }
    ]
   }
  ]
 },
 "l0-ya": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "mountain",
      "say": "やま",
      "size": "big"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "winter",
      "say": "ふゆ"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "vegetables",
      "say": "やさい"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "snow",
      "say": "ゆき"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "cow-strong",
      "say": "うし"
     }
    ]
   }
  ]
 },
 "l0-ra": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "bird",
      "say": "とり"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "car",
      "say": "くるま"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "sakura-white",
      "say": "さくら"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "mountain",
      "say": "やま"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "sakura",
      "say": "さくら"
     }
    ]
   }
  ]
 },
 "l0-wa": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "book-circle",
      "say": "ほん"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "whitecat",
      "say": "ねこ"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "japanmap",
      "say": "にほん"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "hand",
      "say": "て"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "house",
      "say": "いえ",
      "size": "small"
     }
    ]
   }
  ]
 },
 "l0-dakuten": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "book-stripes",
      "say": "ほん"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "telephone",
      "say": "でんわ"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "window",
      "say": "まど",
      "size": "big"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "bread",
      "say": "ぱん"
     }
    ]
   }
  ]
 },
 "intro": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 2,
    "props": [
     {
      "art": "usflag",
      "say": "アメリカじん"
     }
    ]
   }
  ]
 },
 "greetings": {
  "postcard": "bg-street",
  "world": [],
  "pages": []
 },
 "this-that": {
  "postcard": "bg-room",
  "world": [
   {
    "art": "book-circle",
    "say": "ほん"
   },
   {
    "art": "bag",
    "say": "かばん"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "mystery",
      "say": "これ"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "book-circle",
      "say": "ほん"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "bag",
      "say": "かばん"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "bag",
      "say": "かばん"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "book-circle",
      "say": "ほん"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "book-circle",
      "say": "ほん"
     },
     {
      "art": "book-stripes",
      "say": "ほん"
     },
     {
      "art": "book-window",
      "say": "ほん"
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "book-circle",
      "say": "ほん"
     }
    ]
   }
  ]
 },
 "numbers": {
  "postcard": "bg-street",
  "world": [],
  "pages": []
 },
 "age": {
  "postcard": "bg-street",
  "world": [],
  "pages": []
 },
 "shop": {
  "postcard": "bg-shop",
  "world": [
   {
    "art": "water",
    "say": "みず"
   },
   {
    "art": "coffee",
    "say": "コーヒー"
   }
  ],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "water",
      "say": "みず"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "water",
      "say": "みず"
     }
    ]
   }
  ]
 },
 "money": {
  "postcard": "bg-shop",
  "world": [
   {
    "art": "coin100",
    "say": "ひゃく"
   }
  ],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "coin100",
      "say": "ひゃく"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "coin500",
      "say": "ごひゃく"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     },
     {
      "art": "coin100",
      "say": "さんびゃく",
      "count": 3
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "water",
      "say": "みず"
     },
     {
      "art": "coin100",
      "say": "ひゃく"
     }
    ]
   },
   {
    "i": 7,
    "props": [
     {
      "art": "yen-1000-bill",
      "say": "せん"
     }
    ]
   }
  ]
 },
 "counters": {
  "postcard": "bg-shop",
  "world": [
   {
    "art": "coffee",
    "say": "コーヒー"
   },
   {
    "art": "water",
    "say": "みず"
   }
  ],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー",
      "count": 2
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "water",
      "say": "みず",
      "count": 3
     }
    ]
   }
  ]
 },
 "where": {
  "postcard": "bg-street",
  "world": [
   {
    "art": "station",
    "say": "えき"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "wc",
      "say": "トイレ"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "station",
      "say": "えき"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "water",
      "say": "みず"
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "station",
      "say": "えき"
     }
    ]
   }
  ]
 },
 "cafe": {
  "postcard": "bg-shop",
  "world": [
   {
    "art": "menu",
    "say": "メニュー"
   },
   {
    "art": "coffee",
    "say": "コーヒー"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "menu",
      "say": "メニュー"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     },
     {
      "art": "greentea",
      "say": "おちゃ"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "cake",
      "say": "ケーキ"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "greentea",
      "say": "おちゃ",
      "count": 2
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "water",
      "say": "みず"
     }
    ]
   }
  ]
 },
 "verbs": {
  "postcard": "bg-room",
  "world": [],
  "pages": []
 },
 "object": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "gohan",
      "say": "ごはん"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "water",
      "say": "みず"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "cinema",
      "say": "えいが"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "book-circle",
      "say": "ほん"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "japanese-writing",
      "say": "にほんご"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   }
  ]
 },
 "negative": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "sake",
      "say": "おさけ"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "meat",
      "say": "にく"
     }
    ]
   }
  ]
 },
 "coming-going": {
  "postcard": "bg-street",
  "world": [
   {
    "art": "school",
    "say": "がっこう"
   },
   {
    "art": "house",
    "say": "うち"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "school",
      "say": "がっこう"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "house",
      "say": "うち"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "japanmap",
      "say": "にほん"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "house",
      "say": "うち"
     }
    ]
   }
  ]
 },
 "routine": {
  "postcard": "bg-room",
  "world": [
   {
    "art": "coffee",
    "say": "コーヒー"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "clockface-seven",
      "say": "しちじ"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "train",
      "say": "でんしゃ"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "clockface-seven",
      "say": "しちじ"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "train",
      "say": "でんしゃ"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   }
  ]
 },
 "telling-time": {
  "postcard": "bg-room",
  "world": [],
  "pages": []
 },
 "frequency": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "tv",
      "say": "テレビ"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   }
  ]
 },
 "activities": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "office",
      "say": "かいしゃ"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "house",
      "say": "うち"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "gohan",
      "say": "ごはん"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "tv",
      "say": "テレビ"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "house",
      "say": "うち"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "office",
      "say": "かいしゃ"
     }
    ]
   }
  ]
 },
 "past-1": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "cinema",
      "say": "えいが"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "gohan",
      "say": "ごはん"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "cinema",
      "say": "えいが"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "gohan",
      "say": "ごはん"
     }
    ]
   },
   {
    "i": 7,
    "props": [
     {
      "art": "cinema",
      "say": "えいが"
     }
    ]
   }
  ]
 },
 "past-negative": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 4,
    "props": [
     {
      "art": "book-circle",
      "say": "ほん"
     }
    ]
   }
  ]
 },
 "was-were": {
  "postcard": "bg-shop",
  "world": [],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "sushi",
      "say": "おすし"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "coin500",
      "say": "ごひゃく"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "water",
      "say": "みず"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   }
  ]
 },
 "sequence": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "breakfast",
      "say": "あさごはん"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "park",
      "say": "こうえん"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "house",
      "say": "うち"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "dinner",
      "say": "ばんごはん"
     }
    ]
   }
  ]
 },
 "wants": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "japanmap",
      "say": "にほん"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "sushi",
      "say": "おすし"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "car",
      "say": "くるま"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "japanmap",
      "say": "にほん"
     },
     {
      "art": "sushi",
      "say": "おすし"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "car",
      "say": "くるま"
     }
    ]
   }
  ]
 },
 "lets": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 2,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "cinema",
      "say": "えいが"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "japanmap",
      "say": "にほん"
     }
    ]
   }
  ]
 },
 "likes": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "sushi",
      "say": "おすし"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "cat",
      "say": "ねこ"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "vegetables",
      "say": "やさい"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "music-notes",
      "say": "おんがく"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "japanmap",
      "say": "にほん"
     }
    ]
   }
  ]
 },
 "can-do": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 2,
    "props": [
     {
      "art": "cooking-pan",
      "say": "りょうり"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "steering-wheel",
      "say": "うんてん"
     }
    ]
   }
  ]
 },
 "adjectives": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "cinema",
      "say": "えいが"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "cinema-expensive",
      "say": "えいが"
     }
    ]
   }
  ]
 },
 "adj-noun": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "house",
      "say": "いえ",
      "size": "big"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "car",
      "say": "くるま",
      "size": "small"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "house-new",
      "say": "いえ"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "book-old",
      "say": "ほん"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "car",
      "say": "くるま"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "town",
      "say": "まち",
      "size": "big"
     }
    ]
   }
  ]
 },
 "na-adj": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 2,
    "props": [
     {
      "art": "town-quiet",
      "say": "まち"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "flower",
      "say": "はな"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "sushi",
      "say": "おすし"
     }
    ]
   }
  ]
 },
 "adj-negative": {
  "postcard": "bg-street",
  "world": [],
  "pages": []
 },
 "te-form": {
  "postcard": "bg-street",
  "world": [],
  "pages": []
 },
 "te-please": {
  "postcard": "bg-street",
  "world": [],
  "pages": []
 },
 "te-iru": {
  "postcard": "bg-room",
  "world": [
   {
    "art": "tv",
    "say": "テレビ"
   }
  ],
  "pages": [
   {
    "i": 2,
    "props": [
     {
      "art": "tv",
      "say": "テレビ"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "tokyo-tower",
      "say": "とうきょう"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "bank",
      "say": "ぎんこう"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "book-circle",
      "say": "ほん"
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   }
  ]
 },
 "because": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 6,
    "props": [
     {
      "art": "raincloud",
      "say": "あめ"
     }
    ]
   }
  ]
 },
 "but-kedo": {
  "postcard": "bg-shop",
  "world": [],
  "pages": [
   {
    "i": 2,
    "props": [
     {
      "art": "wallet-empty",
      "say": "おかね"
     }
    ]
   }
  ]
 },
 "permission": {
  "postcard": "bg-shop",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "camera",
      "say": "しゃしん"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "chair",
      "say": "ここ"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "sign-no-photos",
      "say": "しゃしん"
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "sign-no-smoking",
      "say": "たばこ"
     }
    ]
   }
  ]
 },
 "sequence-te": {
  "postcard": "bg-room",
  "world": [
   {
    "art": "coffee",
    "say": "コーヒー"
   }
  ],
  "pages": [
   {
    "i": 2,
    "props": [
     {
      "art": "gohan",
      "say": "ごはん"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "book-circle",
      "say": "ほん"
     },
     {
      "art": "cinema",
      "say": "えいが"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "bathtub",
      "say": "おふろ"
     },
     {
      "art": "bed",
      "say": "ねます"
     }
    ]
   }
  ]
 },
 "timing": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "toothbrush",
      "say": "は"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "emptyplate",
      "say": "しょくじ"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "cinema",
      "say": "えいが"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "hand",
      "say": "て"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "telephone",
      "say": "でんわ"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "telephone",
      "say": "でんわして"
     }
    ]
   }
  ]
 },
 "directions": {
  "postcard": "bg-street",
  "world": [
   {
    "art": "signal",
    "say": "しんごう"
   },
   {
    "art": "station",
    "say": "えき"
   }
  ],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "signal",
      "say": "しんごう"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "station",
      "say": "えき"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "intersection",
      "say": "こうさてん"
     }
    ]
   },
   {
    "i": 7,
    "props": [
     {
      "art": "station",
      "say": "えき"
     }
    ]
   }
  ]
 },
 "transport": {
  "postcard": "bg-street",
  "world": [
   {
    "art": "train",
    "say": "でんしゃ"
   },
   {
    "art": "bus",
    "say": "バス"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "train",
      "say": "でんしゃ"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "taxi",
      "say": "タクシー"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "tokyo-tower",
      "say": "とうきょう"
     },
     {
      "art": "osaka-castle",
      "say": "おおさか"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "bus",
      "say": "バス"
     },
     {
      "art": "airport",
      "say": "くうこう"
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "subway",
      "say": "ちかてつ"
     }
    ]
   },
   {
    "i": 7,
    "props": [
     {
      "art": "bicycle",
      "say": "じてんしゃ"
     },
     {
      "art": "station",
      "say": "えき"
     }
    ]
   }
  ]
 },
 "does-this-go": {
  "postcard": "bg-station",
  "world": [
   {
    "art": "train",
    "say": "でんしゃ"
   },
   {
    "art": "platform",
    "say": "ホーム"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "bus",
      "say": "バス"
     },
     {
      "art": "station",
      "say": "えき"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "train",
      "say": "でんしゃ"
     },
     {
      "art": "airport",
      "say": "くうこう"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "sign-exit",
      "say": "でぐち"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "platform",
      "say": "なんばんせん"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "sign-shibuya",
      "say": "しぶや"
     },
     {
      "art": "platform",
      "say": "ホーム"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "train",
      "say": "でんしゃ"
     },
     {
      "art": "sign-shibuya",
      "say": "しぶや"
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "bus",
      "say": "バス"
     },
     {
      "art": "airport",
      "say": "くうこう"
     }
    ]
   },
   {
    "i": 7,
    "props": [
     {
      "art": "sign-exit-right",
      "say": "でぐち"
     }
    ]
   }
  ]
 },
 "how-far": {
  "postcard": "bg-street",
  "world": [
   {
    "art": "station",
    "say": "えき"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "station",
      "say": "えき"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "airport",
      "say": "くうこう"
     }
    ]
   },
   {
    "i": 7,
    "props": [
     {
      "art": "bus",
      "say": "バス"
     }
    ]
   }
  ]
 },
 "tickets": {
  "postcard": "bg-station",
  "world": [
   {
    "art": "ticket",
    "say": "きっぷ"
   }
  ],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "ticket",
      "say": "いちまい"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "ticket",
      "say": "にまい",
      "count": 2
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "ticket",
      "say": "いちまい"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "ticket",
      "say": "きっぷ"
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "ticket",
      "say": "まい",
      "count": 2
     }
    ]
   }
  ]
 },
 "travel-trouble": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "train",
      "say": "でんしゃ"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "wallet",
      "say": "さいふ"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "station",
      "say": "えき"
     }
    ]
   },
   {
    "i": 5,
    "props": [
     {
      "art": "smartphone",
      "say": "けいたい"
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "ticket",
      "say": "きっぷ"
     }
    ]
   },
   {
    "i": 7,
    "props": [
     {
      "art": "bus",
      "say": "バス"
     }
    ]
   }
  ]
 },
 "had-better": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "taxi",
      "say": "タクシー"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "umbrella",
      "say": "かさ"
     }
    ]
   },
   {
    "i": 6,
    "props": [
     {
      "art": "station",
      "say": "えき"
     }
    ]
   },
   {
    "i": 7,
    "props": [
     {
      "art": "taxi",
      "say": "タクシー"
     }
    ]
   }
  ]
 },
 "plain-form": {
  "postcard": "bg-street",
  "world": [],
  "pages": []
 },
 "making-plans": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "gohan",
      "say": "ごはん"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "station",
      "say": "えき"
     }
    ]
   }
  ]
 },
 "i-think": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "raincloud",
      "say": "あめ"
     }
    ]
   }
  ]
 },
 "quoting": {
  "postcard": "bg-street",
  "world": [],
  "pages": []
 },
 "favors": {
  "postcard": "bg-room",
  "world": [],
  "pages": []
 },
 "comparing": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "train",
      "say": "でんしゃ"
     },
     {
      "art": "bus",
      "say": "バス"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "coffee",
      "say": "コーヒー"
     }
    ]
   }
  ]
 },
 "reactions": {
  "postcard": "bg-street",
  "world": [],
  "pages": []
 },
 "conditionals": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "smartphone",
      "say": "でんわして"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "raincloud",
      "say": "あめ"
     }
    ]
   }
  ]
 },
 "have-to": {
  "postcard": "bg-room",
  "world": [],
  "pages": []
 },
 "potential": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "natto",
      "say": "なっとう"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "kanji-card",
      "say": "かんじ"
     }
    ]
   }
  ]
 },
 "intend": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 4,
    "props": [
     {
      "art": "japanmap",
      "say": "にほん"
     }
    ]
   }
  ]
 },
 "seems": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 2,
    "props": [
     {
      "art": "raincloud",
      "say": "あめ"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "sign-closed",
      "say": "やすみ"
     }
    ]
   }
  ]
 },
 "try-doing": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 4,
    "props": [
     {
      "art": "emptyplate",
      "say": "ぜんぶ"
     }
    ]
   }
  ]
 },
 "experience": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 0,
    "props": [
     {
      "art": "sushi",
      "say": "すし"
     }
    ]
   },
   {
    "i": 1,
    "props": [
     {
      "art": "japanmap",
      "say": "にほん"
     }
    ]
   },
   {
    "i": 2,
    "props": [
     {
      "art": "mt-fuji",
      "say": "ふじさん"
     }
    ]
   },
   {
    "i": 3,
    "props": [
     {
      "art": "cinema",
      "say": "えいが"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "snow",
      "say": "ゆき"
     }
    ]
   }
  ]
 },
 "passive": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "wallet",
      "say": "さいふ"
     }
    ]
   },
   {
    "i": 4,
    "props": [
     {
      "art": "raincloud",
      "say": "あめ"
     }
    ]
   }
  ]
 },
 "causative": {
  "postcard": "bg-room",
  "world": [],
  "pages": []
 },
 "causative-passive": {
  "postcard": "bg-room",
  "world": [],
  "pages": []
 },
 "should-supposed": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 2,
    "props": [
     {
      "art": "train",
      "say": "でんしゃ"
     }
    ]
   }
  ]
 },
 "even-though": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 3,
    "props": [
     {
      "art": "raincloud",
      "say": "あめ"
     }
    ]
   }
  ]
 },
 "you-ni": {
  "postcard": "bg-room",
  "world": [],
  "pages": [
   {
    "i": 3,
    "props": [
     {
      "art": "sweets",
      "say": "あまいもの"
     }
    ]
   }
  ]
 },
 "wake": {
  "postcard": "bg-room",
  "world": [],
  "pages": []
 },
 "sonkeigo": {
  "postcard": "bg-shop",
  "world": [],
  "pages": []
 },
 "kenjougo": {
  "postcard": "bg-office",
  "world": [],
  "pages": []
 },
 "business-keigo": {
  "postcard": "bg-office",
  "world": [],
  "pages": []
 },
 "zaru-o-enai": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 4,
    "props": [
     {
      "art": "raincloud",
      "say": "あめ"
     }
    ]
   }
  ]
 },
 "ni-oite": {
  "postcard": "bg-office",
  "world": [],
  "pages": []
 },
 "monono": {
  "postcard": "bg-street",
  "world": [],
  "pages": [
   {
    "i": 1,
    "props": [
     {
      "art": "winter",
      "say": "ふゆ"
     }
    ]
   }
  ]
 },
 "kagiri": {
  "postcard": "bg-room",
  "world": [],
  "pages": []
 }
};
