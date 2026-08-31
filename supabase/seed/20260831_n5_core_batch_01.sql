-- ENO JAPAN N5 CORE CONTENT BATCH 01
-- Original educational content. Designed for JLPT-aligned practice; not copied from textbooks or unpublished JLPT questions.
-- Idempotent by term/level or pattern/level.

insert into public.vocabulary (level, term, reading, romaji, meaning_id, meaning_en, part_of_speech, examples, source, is_published, sort_order)
select v.level, v.term, v.reading, v.romaji, v.meaning_id, v.meaning_en, v.part_of_speech, v.examples::jsonb, 'eno_original', true, v.sort_order
from (values
('N5','私','わたし','watashi','saya','I; me','meishi','[{"jp":"私はエノです。","id":"Saya Eno."}]',101),
('N5','あなた','あなた','anata','kamu','you','meishi','[{"jp":"あなたは学生ですか。","id":"Apakah kamu pelajar?"}]',102),
('N5','先生','せんせい','sensei','guru','teacher','meishi','[{"jp":"先生に聞きます。","id":"Saya bertanya kepada guru."}]',103),
('N5','学生','がくせい','gakusei','pelajar','student','meishi','[{"jp":"私は学生です。","id":"Saya pelajar."}]',104),
('N5','会社員','かいしゃいん','kaishain','pegawai perusahaan','company employee','meishi','[{"jp":"父は会社員です。","id":"Ayah saya pegawai perusahaan."}]',105),
('N5','友達','ともだち','tomodachi','teman','friend','meishi','[{"jp":"友達と話します。","id":"Saya berbicara dengan teman."}]',106),
('N5','家族','かぞく','kazoku','keluarga','family','meishi','[{"jp":"家族は四人です。","id":"Keluarga saya terdiri dari empat orang."}]',107),
('N5','名前','なまえ','namae','nama','name','meishi','[{"jp":"名前を書いてください。","id":"Tolong tulis nama Anda."}]',108),
('N5','国','くに','kuni','negara','country','meishi','[{"jp":"あなたの国はどこですか。","id":"Negara Anda di mana?"}]',109),
('N5','日本','にほん','nihon','Jepang','Japan','meishi','[{"jp":"日本に住んでいます。","id":"Saya tinggal di Jepang."}]',110),
('N5','今日','きょう','kyou','hari ini','today','meishi','[{"jp":"今日は暑いです。","id":"Hari ini panas."}]',111),
('N5','明日','あした','ashita','besok','tomorrow','meishi','[{"jp":"明日は休みです。","id":"Besok libur."}]',112),
('N5','昨日','きのう','kinou','kemarin','yesterday','meishi','[{"jp":"昨日、映画を見ました。","id":"Kemarin saya menonton film."}]',113),
('N5','朝','あさ','asa','pagi','morning','meishi','[{"jp":"朝ごはんを食べます。","id":"Saya sarapan."}]',114),
('N5','昼','ひる','hiru','siang','noon; daytime','meishi','[{"jp":"昼に帰ります。","id":"Saya pulang siang hari."}]',115),
('N5','夜','よる','yoru','malam','night','meishi','[{"jp":"夜は勉強します。","id":"Saya belajar pada malam hari."}]',116),
('N5','時間','じかん','jikan','waktu; jam','time; hour','meishi','[{"jp":"二時間勉強しました。","id":"Saya belajar selama dua jam."}]',117),
('N5','毎日','まいにち','mainichi','setiap hari','every day','fukushi','[{"jp":"毎日日本語を勉強します。","id":"Saya belajar bahasa Jepang setiap hari."}]',118),
('N5','毎週','まいしゅう','maishuu','setiap minggu','every week','fukushi','[{"jp":"毎週日曜日に休みます。","id":"Saya libur setiap hari Minggu."}]',119),
('N5','学校','がっこう','gakkou','sekolah','school','meishi','[{"jp":"学校へ行きます。","id":"Saya pergi ke sekolah."}]',120),
('N5','大学','だいがく','daigaku','universitas','university','meishi','[{"jp":"大学で日本語を勉強します。","id":"Saya belajar bahasa Jepang di universitas."}]',121),
('N5','駅','えき','eki','stasiun','station','meishi','[{"jp":"駅で会いましょう。","id":"Mari bertemu di stasiun."}]',122),
('N5','電車','でんしゃ','densha','kereta listrik','train','meishi','[{"jp":"電車で会社へ行きます。","id":"Saya pergi ke kantor naik kereta."}]',123),
('N5','車','くるま','kuruma','mobil','car','meishi','[{"jp":"車があります。","id":"Saya punya mobil."}]',124),
('N5','自転車','じてんしゃ','jitensha','sepeda','bicycle','meishi','[{"jp":"自転車で学校へ行きます。","id":"Saya pergi ke sekolah naik sepeda."}]',125),
('N5','店','みせ','mise','toko','shop; store','meishi','[{"jp":"あの店で買います。","id":"Saya membeli di toko itu."}]',126),
('N5','食堂','しょくどう','shokudou','kantin; ruang makan','cafeteria; dining hall','meishi','[{"jp":"食堂で昼ごはんを食べます。","id":"Saya makan siang di kantin."}]',127),
('N5','病院','びょういん','byouin','rumah sakit','hospital','meishi','[{"jp":"病院へ行きます。","id":"Saya pergi ke rumah sakit."}]',128),
('N5','薬','くすり','kusuri','obat','medicine','meishi','[{"jp":"薬を飲みます。","id":"Saya minum obat."}]',129),
('N5','天気','てんき','tenki','cuaca','weather','meishi','[{"jp":"今日は天気がいいです。","id":"Cuaca hari ini bagus."}]',130),
('N5','雨','あめ','ame','hujan','rain','meishi','[{"jp":"雨が降っています。","id":"Hujan sedang turun."}]',131),
('N5','雪','ゆき','yuki','salju','snow','meishi','[{"jp":"冬に雪が降ります。","id":"Salju turun pada musim dingin."}]',132),
('N5','暑い','あつい','atsui','panas','hot','keiyoushi','[{"jp":"今日はとても暑いです。","id":"Hari ini sangat panas."}]',133),
('N5','寒い','さむい','samui','dingin','cold','keiyoushi','[{"jp":"冬は寒いです。","id":"Musim dingin dingin."}]',134),
('N5','新しい','あたらしい','atarashii','baru','new','keiyoushi','[{"jp":"新しい本を買いました。","id":"Saya membeli buku baru."}]',135),
('N5','古い','ふるい','furui','lama; tua','old','keiyoushi','[{"jp":"これは古い写真です。","id":"Ini foto lama."}]',136),
('N5','大きい','おおきい','ookii','besar','big','keiyoushi','[{"jp":"大きい家に住んでいます。","id":"Saya tinggal di rumah besar."}]',137),
('N5','小さい','ちいさい','chiisai','kecil','small','keiyoushi','[{"jp":"小さい犬がいます。","id":"Ada anjing kecil."}]',138),
('N5','長い','ながい','nagai','panjang','long','keiyoushi','[{"jp":"髪が長いです。","id":"Rambutnya panjang."}]',139),
('N5','短い','みじかい','mijikai','pendek','short','keiyoushi','[{"jp":"夏は夜が短いです。","id":"Pada musim panas malam lebih pendek."}]',140),
('N5','高い','たかい','takai','tinggi; mahal','high; expensive','keiyoushi','[{"jp":"この時計は高いです。","id":"Jam ini mahal."}]',141),
('N5','安い','やすい','yasui','murah','cheap','keiyoushi','[{"jp":"この店は安いです。","id":"Toko ini murah."}]',142),
('N5','良い','いい','ii','baik','good','keiyoushi','[{"jp":"今日は天気がいいです。","id":"Cuaca hari ini bagus."}]',143),
('N5','悪い','わるい','warui','buruk','bad','keiyoushi','[{"jp":"気分が悪いです。","id":"Saya merasa tidak enak badan."}]',144),
('N5','忙しい','いそがしい','isogashii','sibuk','busy','keiyoushi','[{"jp":"今日は仕事が忙しいです。","id":"Hari ini pekerjaan sibuk."}]',145),
('N5','楽しい','たのしい','tanoshii','menyenangkan','fun; enjoyable','keiyoushi','[{"jp":"日本語の勉強は楽しいです。","id":"Belajar bahasa Jepang menyenangkan."}]',146),
('N5','難しい','むずかしい','muzukashii','sulit','difficult','keiyoushi','[{"jp":"この問題は難しいです。","id":"Soal ini sulit."}]',147),
('N5','易しい','やさしい','yasashii','mudah','easy','keiyoushi','[{"jp":"この問題は易しいです。","id":"Soal ini mudah."}]',148),
('N5','食べる','たべる','taberu','makan','to eat','doushi','[{"jp":"朝ごはんを食べます。","id":"Saya makan sarapan."}]',149),
('N5','飲む','のむ','nomu','minum','to drink','doushi','[{"jp":"水を飲みます。","id":"Saya minum air."}]',150),
('N5','見る','みる','miru','melihat; menonton','to see; watch','doushi','[{"jp":"映画を見ます。","id":"Saya menonton film."}]',151),
('N5','聞く','きく','kiku','mendengar; bertanya','to listen; ask','doushi','[{"jp":"先生に聞きます。","id":"Saya bertanya kepada guru."}]',152),
('N5','読む','よむ','yomu','membaca','to read','doushi','[{"jp":"本を読みます。","id":"Saya membaca buku."}]',153),
('N5','書く','かく','kaku','menulis','to write','doushi','[{"jp":"名前を書きます。","id":"Saya menulis nama."}]',154),
('N5','話す','はなす','hanasu','berbicara','to speak','doushi','[{"jp":"日本語を話します。","id":"Saya berbicara bahasa Jepang."}]',155),
('N5','買う','かう','kau','membeli','to buy','doushi','[{"jp":"本を買います。","id":"Saya membeli buku."}]',156),
('N5','使う','つかう','tsukau','menggunakan','to use','doushi','[{"jp":"このペンを使います。","id":"Saya menggunakan pena ini."}]',157),
('N5','作る','つくる','tsukuru','membuat','to make','doushi','[{"jp":"晩ごはんを作ります。","id":"Saya membuat makan malam."}]',158),
('N5','会う','あう','au','bertemu','to meet','doushi','[{"jp":"駅で友達に会います。","id":"Saya bertemu teman di stasiun."}]',159),
('N5','帰る','かえる','kaeru','pulang','to return home','doushi','[{"jp":"六時に家へ帰ります。","id":"Saya pulang ke rumah pukul enam."}]',160),
('N5','寝る','ねる','neru','tidur','to sleep','doushi','[{"jp":"十一時に寝ます。","id":"Saya tidur pukul sebelas."}]',161),
('N5','起きる','おきる','okiru','bangun','to wake up','doushi','[{"jp":"毎朝六時に起きます。","id":"Saya bangun pukul enam setiap pagi."}]',162),
('N5','働く','はたらく','hataraku','bekerja','to work','doushi','[{"jp":"会社で働いています。","id":"Saya bekerja di perusahaan."}]',163),
('N5','休む','やすむ','yasumu','beristirahat; libur','to rest; take a day off','doushi','[{"jp":"日曜日に休みます。","id":"Saya libur hari Minggu."}]',164),
('N5','勉強する','べんきょうする','benkyou suru','belajar','to study','doushi','[{"jp":"毎日日本語を勉強します。","id":"Saya belajar bahasa Jepang setiap hari."}]',165),
('N5','分かる','わかる','wakaru','mengerti','to understand','doushi','[{"jp":"日本語が分かります。","id":"Saya mengerti bahasa Jepang."}]',166),
('N5','ある','ある','aru','ada; mempunyai (benda)','to exist; have (non-living)','doushi','[{"jp":"机の上に本があります。","id":"Ada buku di atas meja."}]',167),
('N5','いる','いる','iru','ada (makhluk hidup)','to exist; be (living)','doushi','[{"jp":"部屋に猫がいます。","id":"Ada kucing di kamar."}]',168)
) as v(level,term,reading,romaji,meaning_id,meaning_en,part_of_speech,examples,sort_order)
where not exists (select 1 from public.vocabulary x where x.level=v.level and x.term=v.term);

insert into public.grammar_points (level, pattern, meaning_id, meaning_en, structure, explanation_id, examples, source, is_published, sort_order)
select g.level, g.pattern, g.meaning_id, g.meaning_en, g.structure, g.explanation_id, g.examples::jsonb, 'eno_original', true, g.sort_order
from (values
('N5','N は N です','N adalah N','N is N','N1 は N2 です','Pola dasar untuk menyatakan identitas atau klasifikasi.','[{"jp":"私は学生です。","id":"Saya adalah pelajar."}]',201),
('N5','N は N じゃありません','N bukan N','N is not N','N1 は N2 じゃありません','Bentuk negatif dari です dalam percakapan umum.','[{"jp":"私は先生じゃありません。","id":"Saya bukan guru."}]',202),
('N5','N は N ですか','apakah N adalah N','is N N?','N1 は N2 ですか','Pertanyaan ya/tidak dengan ですか.','[{"jp":"あなたは学生ですか。","id":"Apakah kamu pelajar?"}]',203),
('N5','これ・それ・あれ','ini/itu/itu di sana','this/that/that over there','これ／それ／あれ + です','Kata tunjuk benda berdasarkan jarak dari pembicara dan lawan bicara.','[{"jp":"これは本です。","id":"Ini buku."}]',204),
('N5','この・その・あの + N','N ini/itu','this/that + noun','この／その／あの + N','Kata tunjuk yang langsung menerangkan nomina.','[{"jp":"この本はおもしろいです。","id":"Buku ini menarik."}]',205),
('N5','ここ・そこ・あそこ','di sini/di situ/di sana','here/there/over there','ここ／そこ／あそこ + です','Menunjukkan tempat.','[{"jp":"駅はここです。","id":"Stasiunnya di sini."}]',206),
('N5','N の N','N milik/jenis N','N of N','N1 の N2','Menghubungkan dua nomina untuk kepemilikan, kategori, atau hubungan.','[{"jp":"これは日本語の本です。","id":"Ini buku bahasa Jepang."}]',207),
('N5','N を V','melakukan V terhadap N','V an object','N を V','Menandai objek langsung.','[{"jp":"水を飲みます。","id":"Saya minum air."}]',208),
('N5','N に V','ke/kepada N','to N','N に V','Menandai tujuan atau penerima tergantung verba.','[{"jp":"先生に聞きます。","id":"Saya bertanya kepada guru."}]',209),
('N5','N で V','di/dengan N','at/with N','N で V','Menandai tempat berlangsungnya aktivitas atau alat/cara.','[{"jp":"電車で行きます。","id":"Saya pergi dengan kereta."}]',210),
('N5','V-ます','bentuk sopan non-lampau','polite non-past','ます-form','Bentuk sopan dasar untuk percakapan dan pernyataan umum.','[{"jp":"毎日勉強します。","id":"Saya belajar setiap hari."}]',211),
('N5','V-ました','bentuk sopan lampau','polite past','V-ます → V-ました','Menyatakan tindakan yang sudah selesai.','[{"jp":"昨日映画を見ました。","id":"Kemarin saya menonton film."}]',212),
('N5','V-ません','bentuk sopan negatif','polite negative','V-ます → V-ません','Menyatakan tidak melakukan sesuatu.','[{"jp":"肉を食べません。","id":"Saya tidak makan daging."}]',213),
('N5','V-ませんでした','bentuk sopan negatif lampau','polite past negative','V-ます → V-ませんでした','Menyatakan sesuatu yang tidak dilakukan di masa lalu.','[{"jp":"昨日学校へ行きませんでした。","id":"Kemarin saya tidak pergi ke sekolah."}]',214),
('N5','〜たいです','ingin melakukan','want to do','V-ます stem + たいです','Menyatakan keinginan pembicara.','[{"jp":"日本へ行きたいです。","id":"Saya ingin pergi ke Jepang."}]',215),
('N5','〜てください','tolong lakukan','please do','V-て + ください','Permintaan sopan.','[{"jp":"名前を書いてください。","id":"Tolong tulis nama."}]',216),
('N5','〜てもいいです','boleh','may; be allowed to','V-て + もいいです','Meminta atau memberi izin.','[{"jp":"ここに座ってもいいですか。","id":"Bolehkah saya duduk di sini?"}]',217),
('N5','〜てはいけません','tidak boleh','must not','V-て + はいけません','Larangan.','[{"jp":"ここで写真を撮ってはいけません。","id":"Tidak boleh mengambil foto di sini."}]',218),
('N5','〜ています','sedang; keadaan hasil','be doing; state','V-て + います','Menyatakan aktivitas yang sedang berlangsung atau keadaan tertentu.','[{"jp":"今勉強しています。","id":"Sekarang saya sedang belajar."}]',219),
('N5','〜から〜まで','dari sampai','from...to...','N/Time から N/Time まで','Menunjukkan rentang waktu atau tempat.','[{"jp":"九時から五時まで働きます。","id":"Saya bekerja dari jam sembilan sampai jam lima."}]',220),
('N5','〜が好きです','suka','like','N が 好きです','Menyatakan kesukaan.','[{"jp":"日本料理が好きです。","id":"Saya suka masakan Jepang."}]',221),
('N5','〜が上手です','pandai','be good at','N が 上手です','Menyatakan kemampuan yang baik pada suatu bidang.','[{"jp":"日本語が上手です。","id":"Bahasa Jepangnya bagus."}]',222),
('N5','〜が分かります','mengerti','understand','N が 分かります','Menyatakan pemahaman.','[{"jp":"日本語が少し分かります。","id":"Saya sedikit mengerti bahasa Jepang."}]',223),
('N5','〜から','karena','because','Clause + から','Memberikan alasan.','[{"jp":"忙しいですから、行きません。","id":"Karena sibuk, saya tidak pergi."}]',224),
('N5','〜ましょう','mari','let us','V-ます stem + ましょう','Mengajak melakukan sesuatu bersama.','[{"jp":"一緒に勉強しましょう。","id":"Mari belajar bersama."}]',225)
) as g(level,pattern,meaning_id,meaning_en,structure,explanation_id,examples,sort_order)
where not exists (select 1 from public.grammar_points x where x.level=g.level and x.pattern=g.pattern);

insert into public.questions (id, level, skill, kind, prompt, prompt_note, choices, correct_index, explanation_id, source, is_published)
select q.id::uuid, q.level, q.skill::public.content_skill, 'multiple_choice', q.prompt, null, q.choices::jsonb, q.correct_index, q.explanation_id, 'eno_original', true
from (values
('44444444-4444-4444-8444-444444444401','N5','vocabulary','「昨日」の意味はどれですか。','["hari ini","besok","kemarin","setiap hari"]',2,'昨日（きのう）は「kemarin」です。'),
('44444444-4444-4444-8444-444444444402','N5','vocabulary','「駅」の読み方はどれですか。','["えき","いき","おき","えぎ"]',0,'駅 dibaca えき.'),
('44444444-4444-4444-8444-444444444403','N5','grammar','毎日、日本語を勉強し____。','["ます","ました","ませんでした","たい"]',0,'Pernyataan kebiasaan sekarang menggunakan 〜ます.'),
('44444444-4444-4444-8444-444444444404','N5','grammar','名前を____ください。','["書いて","書きて","書くて","書いた"]',0,'Permintaan sopan menggunakan V-てください.'),
('44444444-4444-4444-8444-444444444405','N5','grammar','ここで写真を撮って____。','["もいいです","はいけません","くださいです","ません"]',1,'Larangan menggunakan V-てはいけません.'),
('44444444-4444-4444-8444-444444444406','N5','kanji','「先生」の読み方はどれですか。','["せんせい","せんしょう","せいせん","せんさい"]',0,'先生 dibaca せんせい.'),
('44444444-4444-4444-8444-444444444407','N5','kanji','「日本」の読み方はどれですか。','["にほん","にちほん","にっぽんご","にほんじん"]',0,'日本 dibaca にほん; にっぽん juga ada sebagai pembacaan alternatif, tetapi pilihan soal ini menargetkan にほん.'),
('44444444-4444-4444-8444-444444444408','N5','vocabulary','「忙しい」の意味はどれですか。','["mudah","sibuk","murah","dingin"]',1,'忙しい（いそがしい） berarti sibuk.')
) as q(id,level,skill,prompt,choices,correct_index,explanation_id)
where not exists (select 1 from public.questions x where x.id=q.id::uuid);
