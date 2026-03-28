export const situations = [
    {
        id: 1,
        title: { kr: '카페에서 첫 만남', jp: 'カフェでの初対面' },
        desc: {
            kr: '우연히 합석하게 된 카페에서 말을 걸어보세요.',
            jp: '偶然相席になったカフェで話しかけてみましょう。',
        },
        expressions: {
            kr_wants_jp: [
                {
                    kr: '여기 자리 비어있나요?',
                    jp: 'ここ、空いてますか？',
                    reading: '코코, 아이테마스카?',
                    tip: '자연스러운 첫 마디입니다.',
                    words: [
                        { word: 'ここ (코코)', mean: '여기' },
                        { word: '空く (아쿠)', mean: '비다' },
                    ],
                },
                {
                    kr: '자주 오시나봐요.',
                    jp: 'よく来られるんですか？',
                    reading: '요쿠 코라레룬 데스카?',
                    tip: '가벼운 스몰토크로 대화를 이어갑니다.',
                    words: [
                        { word: 'よく (요쿠)', mean: '자주' },
                        { word: '来る (쿠루)', mean: '오다' },
                    ],
                },
                {
                    kr: '무슨 커피 드시나요?',
                    jp: '何のコーヒーを 飲んで いますか？',
                    reading: '난노 코히오 논데 이마스카?',
                    tip: '마시고 있는 메뉴로 자연스럽게 대화 주제를 잡습니다.',
                    words: [
                        { word: '何 (난)', mean: '무엇' },
                        { word: '飲む (노무)', mean: '마시다' },
                    ],
                },
                {
                    kr: '책 제목이 재미있어 보이네요.',
                    jp: '本の タイトルが 面白そうですね。',
                    reading: '혼노 타이토루가 오모시로 소오 데스네.',
                    tip: '상대가 보고 있는 책이나 소품을 칭찬해보세요.',
                    words: [
                        { word: '本 (혼)', mean: '책' },
                        { word: '面白い (오모시로이)', mean: '재밌다' },
                    ],
                },
                {
                    kr: '분위기가 참 좋네요.',
                    jp: '雰囲気が すごく いいですね。',
                    reading: '훙이키가 스고쿠 이이데스네.',
                    tip: '카페의 분위기를 소재로 말을 걸어봅니다.',
                    words: [
                        { word: '雰囲気 (훙이키)', mean: '분위기' },
                        { word: 'いい (이이)', mean: '좋다' },
                    ],
                },
            ],
            jp_wants_kr: [
                {
                    jp: 'ここ、空いてますか？',
                    kr: '여기 자리 비어있나요?',
                    romaji: 'yeogi jari bieoinnayo?',
                    reading: 'yeogi jari bieoinnayo?',
                },
                {
                    jp: 'よく来られるんですか？',
                    kr: '자주 오시나봐요.',
                    romaji: 'jaju osinabwayo.',
                    reading: 'jaju osinabwayo.',
                },
                {
                    jp: '何のコーヒーを飲んでいますか？',
                    kr: '무슨 커피 드시나요?',
                    romaji: 'museun keopi deusinayo?',
                    reading: 'museun keopi deusinayo?',
                },
                {
                    jp: '本のタイトルが面白そうですね。',
                    kr: '책 제목이 재미있어 보이네요.',
                    romaji: 'chaek jemogi jaemiisseo boineyo.',
                    reading: 'chaek jemogi jaemiisseo boineyo.',
                },
                {
                    jp: '雰囲気がすごくいいですね。',
                    kr: '분위기가 참 좋네요.',
                    romaji: 'bunwigiga cham jonneyo.',
                    reading: 'bunwigiga cham jonneyo.',
                },
            ],
        },
        difficulty: '초급',
    },
    {
        id: 2,
        title: { kr: '연락처 물어보기', jp: '連絡先を聞く' },
        desc: {
            kr: '대화가 잘 통했다면 용기내어 연락처를 물어보세요.',
            jp: '会話が弾んだら勇気を出して連絡先を聞いてみましょう。',
        },
        expressions: {
            kr_wants_jp: [
                {
                    kr: '라인이나 인스타 하세요?',
                    jp: 'LINEかインスタやってますか？',
                    romaji: 'Rain ka insuta yattemasuka?',
                    reading: '라인 카 인스타 얏테마스카?',
                    tip: '일본에서는 라인이 가장 흔합니다.',
                },
                {
                    kr: '조금 더 이야기해보고 싶어요.',
                    jp: 'もう少し話してみたいです。',
                    romaji: 'Mou sukoshi hanashite mitaidesu.',
                    reading: '모오 스코시 하나시테 미타이데스.',
                    tip: '호감을 표시하는 솔직한 말입니다.',
                },
            ],
            jp_wants_kr: [
                {
                    jp: 'カカオやインスタやってますか？',
                    kr: '카톡이나 인스타 하세요?',
                    romaji: 'katogina inseuta haseyo?',
                    reading: 'katogina inseuta haseyo?',
                },
                {
                    jp: 'もう少し話してみたいです。',
                    kr: '조금 더 이야기해보고 싶어요.',
                    romaji: 'jogeum deo iyagihaebogo sipeoyo.',
                    reading: 'jogeum deo iyagihaebogo sipeoyo.',
                },
            ],
        },
        difficulty: '중급',
    },
    {
        id: 3,
        title: { kr: '칭찬하기', jp: '褒める' },
        desc: {
            kr: '상대방의 외모나 스타일을 가볍게 칭찬해보세요.',
            jp: '相手の容姿やスタイルを軽く褒めてみましょう。',
        },
        expressions: {
            kr_wants_jp: [
                {
                    kr: '오늘 스타일 정말 좋으시네요.',
                    jp: '今日のスタイル、すごくいいですね。',
                    romaji: 'Kyou no sutairu, sugoku iidesune.',
                    reading: '쿄오 노 스타이루, 스고쿠 이이데스네.',
                    tip: '자연스러운 칭찬입니다.',
                },
                {
                    kr: '웃는 모습이 예뻐요.',
                    jp: '笑顔が素敵ですね。',
                    romaji: 'Egao ga sutekidesune.',
                    reading: '에가오 가 스테키데스네.',
                    tip: '호감을 높이는 마법의 문장입니다.',
                },
            ],
            jp_wants_kr: [
                {
                    jp: '今日のスタイル、すごくいいですね。',
                    kr: '오늘 스타일 정말 좋으시네요.',
                    romaji: 'oneul seutail jeongmal joeusineyo.',
                    reading: 'oneul seutail jeongmal joeusineyo.',
                },
                {
                    jp: '笑顔が素敵ですね。',
                    kr: '웃는 모습이 예뻐요.',
                    romaji: 'unneun moseubi yeppeoyo.',
                    reading: 'unneun moseubi yeppeoyo.',
                },
            ],
        },
        difficulty: '초급',
    },
    {
        id: 4,
        title: { kr: '데이트 신청하기', jp: 'デートに誘う' },
        desc: {
            kr: '다음에 또 만나자고 제안해보세요.',
            jp: 'また次も会おうと提案してみましょう。',
        },
        expressions: {
            kr_wants_jp: [
                {
                    kr: '이번 주말에 시간 어때요?',
                    jp: '今週末、時間どうですか？',
                    romaji: 'Konshuumatsu, jikan doudesuka?',
                    reading: '콘슈우마츠, 지칸 도오데스카?',
                    tip: '구체적인 시기를 물어보는 것이 좋습니다.',
                },
                {
                    kr: '같이 밥 먹으러 갈래요?',
                    jp: '一緒にご飯食べに行きませんか？',
                    romaji: 'Isshoni gohan tabeni ikimasenka?',
                    reading: '잇쇼니 고한 타베니 이키마센카?',
                    tip: '부담없는 밥 약속을 제안해보세요.',
                },
            ],
            jp_wants_kr: [
                {
                    jp: '今週末、時間どうですか？',
                    kr: '이번 주말에 시간 어때요?',
                    romaji: 'ibeon jumare sigan eottaeyo?',
                    reading: 'ibeon jumare sigan eottaeyo?',
                },
                {
                    jp: '一緒にご飯食べに行きませんか？',
                    kr: '같이 밥 먹으러 갈래요?',
                    romaji: 'gachi bap meogeureo gallaeyo?',
                    reading: 'gachi bap meogeureo gallaeyo?',
                },
            ],
        },
        difficulty: '중고급',
    },
];
