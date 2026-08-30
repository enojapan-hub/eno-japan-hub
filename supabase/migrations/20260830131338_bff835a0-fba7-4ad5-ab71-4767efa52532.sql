
-- ===== KANJI =====
insert into public.kanji (level, character, onyomi, kunyomi, meaning_id, meaning_en, stroke_count, examples, mnemonic, source, is_published, sort_order) values
('N5','本',array['ホン'],array['もと'],'buku, asal','book, origin',5,'[{"jp":"日本","reading":"にほん","id":"Jepang"},{"jp":"本屋","reading":"ほんや","id":"toko buku"}]','Pohon (木) dengan garis di akarnya: asal-usul.','eno_original',true,10),
('N5','月',array['ゲツ','ガツ'],array['つき'],'bulan','moon, month',4,'[{"jp":"月曜日","reading":"げつようび","id":"hari Senin"},{"jp":"一月","reading":"いちがつ","id":"Januari"}]','Bulan sabit di langit malam.','eno_original',true,11),
('N5','火',array['カ'],array['ひ'],'api','fire',4,'[{"jp":"火曜日","reading":"かようび","id":"hari Selasa"},{"jp":"花火","reading":"はなび","id":"kembang api"}]','Bentuk nyala api.','eno_original',true,12),
('N5','水',array['スイ'],array['みず'],'air','water',4,'[{"jp":"水曜日","reading":"すいようび","id":"hari Rabu"},{"jp":"水도","reading":"すいどう","id":"air ledeng"}]','Aliran air.','eno_original',true,13),
('N4','病',array['ビョウ'],array['やまい'],'sakit, penyakit','illness',10,'[{"jp":"病院","reading":"びょういん","id":"rumah sakit"},{"jp":"病気","reading":"びょうき","id":"sakit"}]','Orang terbaring di dipan.','eno_original',true,20),
('N4','院',array['イン'],array[]::text[],'institusi, gedung','institution',10,'[{"jp":"病院","reading":"びょういん","id":"rumah sakit"},{"jp":"大学院","reading":"だいがくいん","id":"pascasarjana"}]','Bangunan bertembok.','eno_original',true,21),
('N3','経',array['ケイ'],array['へ-る'],'melalui, ekonomi','pass through',11,'[{"jp":"経験","reading":"けいけん","id":"pengalaman"},{"jp":"経済","reading":"けいざい","id":"ekonomi"}]','Benang yang melewati alat tenun.','eno_original',true,30),
('N3','験',array['ケン'],array[]::text[],'uji, coba','test',18,'[{"jp":"試験","reading":"しけん","id":"ujian"},{"jp":"経験","reading":"けいけん","id":"pengalaman"}]','Kuda diuji ketangkasannya.','eno_original',true,31),
('N2','資',array['シ'],array[]::text[],'sumber daya, modal','resource',13,'[{"jp":"資料","reading":"しりょう","id":"materi, dokumen"},{"jp":"資格","reading":"しかく","id":"kualifikasi"}]','Harta sebagai modal.','eno_original',true,40),
('N2','格',array['カク'],array[]::text[],'status, standar','status, rank',10,'[{"jp":"合格","reading":"ごうかく","id":"lulus"},{"jp":"性格","reading":"せいかく","id":"watak"}]','Kerangka kayu sebagai standar.','eno_original',true,41),
('N1','憲',array['ケン'],array[]::text[],'konstitusi','constitution',16,'[{"jp":"憲法","reading":"けんぽう","id":"undang-undang dasar"}]','Aturan tertinggi yang mengikat hati.','eno_original',true,50),
('N1','権',array['ケン'],array[]::text[],'hak, kewenangan','right, authority',15,'[{"jp":"権利","reading":"けんり","id":"hak"},{"jp":"人権","reading":"じんけん","id":"hak asasi"}]','Kekuasaan yang berdiri seperti pohon besar.','eno_original',true,51);

-- ===== KANJI RELATIONS =====
insert into public.kanji_relations (kanji_id, related_kanji_id, note_id, sort_order)
select k.id, r.id, n.note, n.ord
from (values
 ('日','月','Sama-sama muncul pada nama hari dalam seminggu.',1),
 ('日','本','Bergabung menjadi 日本 (Jepang).',2),
 ('日','火','Keduanya dipakai pada penanggalan: 日曜日 dan 火曜日.',3),
 ('月','火','Urutan hari: 月曜日 lalu 火曜日.',1),
 ('月','水','Sama-sama nama hari dalam seminggu.',2),
 ('火','水','Pasangan makna api dan air.',1),
 ('火','山','Bergabung menjadi 火山 (gunung berapi).',2),
 ('水','山','Muncul bersama pada kosakata alam seperti 山水.',1),
 ('本','人','Bergabung menjadi 日本人 (orang Jepang).',1),
 ('病','院','Bergabung menjadi 病院 (rumah sakit).',1),
 ('病','人','Bergabung menjadi 病人 (orang sakit).',2),
 ('院','人','Sering muncul bersama pada nama lembaga dan penghuninya.',1),
 ('経','験','Bergabung menjadi 経験 (pengalaman).',1),
 ('験','経','Bergabung menjadi 経験 (pengalaman).',1),
 ('資','格','Bergabung menjadi 資格 (kualifikasi).',1),
 ('格','資','Bergabung menjadi 資格 (kualifikasi).',1),
 ('憲','権','Sama-sama dibaca ケン dan dipakai pada istilah hukum.',1),
 ('権','憲','Muncul bersama pada topik hukum seperti 憲法 dan 人権.',1)
) as n(a,b,note,ord)
join public.kanji k on k.character = n.a
join public.kanji r on r.character = n.b
on conflict do nothing;

-- ===== VOCABULARY =====
insert into public.vocabulary (level, term, reading, romaji, meaning_id, meaning_en, part_of_speech, examples, source, is_published, sort_order) values
('N5','水','みず','mizu','air','water','meishi','[{"jp":"水を飲みます。","id":"Saya minum air."}]','eno_original',true,10),
('N5','本','ほん','hon','buku','book','meishi','[{"jp":"本を読みます。","id":"Saya membaca buku."}]','eno_original',true,11),
('N5','行く','いく','iku','pergi','to go','doushi','[{"jp":"学校へ行きます。","id":"Saya pergi ke sekolah."}]','eno_original',true,12),
('N4','病院','びょういん','byouin','rumah sakit','hospital','meishi','[{"jp":"病院へ行きました。","id":"Saya pergi ke rumah sakit."}]','eno_original',true,20),
('N4','約束','やくそく','yakusoku','janji','promise','meishi','[{"jp":"友だちと約束があります。","id":"Saya ada janji dengan teman."}]','eno_original',true,21),
('N3','経験','けいけん','keiken','pengalaman','experience','meishi','[{"jp":"работа経験があります。","id":"Saya punya pengalaman kerja."}]','eno_original',true,30),
('N3','報告','ほうこく','houkoku','laporan','report','meishi','[{"jp":"結果を報告します。","id":"Saya melaporkan hasilnya."}]','eno_original',true,31),
('N2','資格','しかく','shikaku','kualifikasi','qualification','meishi','[{"jp":"資格を取りたいです。","id":"Saya ingin mendapat sertifikasi."}]','eno_original',true,40),
('N1','権利','けんり','kenri','hak','right','meishi','[{"jp":"だれにも権利があります。","id":"Semua orang punya hak."}]','eno_original',true,50);

update public.vocabulary set examples = '[{"jp":"仕事の経験があります。","id":"Saya punya pengalaman kerja."}]' where term = '経験';
update public.kanji set examples = '[{"jp":"水曜日","reading":"すいようび","id":"hari Rabu"},{"jp":"水道","reading":"すいどう","id":"air ledeng"}]' where character = '水';

-- ===== GRAMMAR =====
insert into public.grammar_points (level, pattern, meaning_id, meaning_en, structure, explanation_id, examples, source, is_published, sort_order) values
('N5','〜たいです','ingin melakukan sesuatu','want to do','V-masu stem + たいです','Menyatakan keinginan diri sendiri.','[{"jp":"日本へ行きたいです。","id":"Saya ingin pergi ke Jepang."}]','eno_original',true,10),
('N4','〜ことができる','bisa / mampu','can do','Kamus + ことができる','Menyatakan kemampuan secara formal.','[{"jp":"漢字を書くことができます。","id":"Saya bisa menulis kanji."}]','eno_original',true,20),
('N3','〜わけではない','bukan berarti','it does not mean that','Bentuk biasa + わけではない','Menyangkal kesimpulan yang mungkin diambil lawan bicara.','[{"jp":"嫌いなわけではない。","id":"Bukan berarti saya benci."}]','eno_original',true,30),
('N2','〜に基づいて','berdasarkan','based on','N + に基づいて','Dipakai dalam konteks formal/tertulis.','[{"jp":"データに基づいて判断する。","id":"Menilai berdasarkan data."}]','eno_original',true,40),
('N1','〜をものともせず','tanpa menghiraukan','without being daunted by','N + をものともせず','Ungkapan tulis yang menonjolkan ketegaran.','[{"jp":"困難をものともせず進んだ。","id":"Ia maju tanpa menghiraukan kesulitan."}]','eno_original',true,50);

-- ===== READING PASSAGES =====
insert into public.reading_passages (id, level, title, body_jp, translation_id, estimated_minutes, sort_order) values
('11111111-1111-4111-8111-111111111101','N5','わたしの一日','わたしは まいあさ 六時に おきます。あさごはんを たべてから、学校へ 行きます。学校は 八時に はじまります。ひるは 友だちと べんとうを たべます。よるは 一時間 日本語を べんきょうします。','Saya bangun pukul enam setiap pagi, sarapan lalu berangkat ke sekolah. Sekolah dimulai pukul delapan. Siang hari saya makan bekal bersama teman. Malamnya saya belajar bahasa Jepang selama satu jam.',3,1),
('11111111-1111-4111-8111-111111111102','N4','図書館の　お知らせ','当図書館は 来週の 月曜日から 水曜日まで 工事の ため 休みます。本を 返す 人は、入口の 返却ボックスを 使って ください。木曜日からは いつも どおり 九時に 開きます。','Perpustakaan tutup Senin sampai Rabu pekan depan karena renovasi. Pengembalian buku dapat menggunakan kotak di pintu masuk. Mulai Kamis, perpustakaan buka seperti biasa pukul sembilan.',4,2);

-- ===== LISTENING ITEMS =====
insert into public.listening_items (id, level, title, audio_url, transcript_jp, transcript_id, duration_seconds, sort_order) values
('22222222-2222-4222-8222-222222222201','N5','駅での会話','', 'A：すみません、この電車は 東京駅に 行きますか。 B：いいえ、行きません。つぎの 電車に のって ください。','A: Permisi, apakah kereta ini menuju Stasiun Tokyo? B: Tidak. Silakan naik kereta berikutnya.',25,1),
('22222222-2222-4222-8222-222222222202','N4','病院の受付','', 'A：はじめてですか。 B：はい。きのうから ねつが あります。 A：では、この 用紙に 名前と 電話番号を 書いて ください。','A: Apakah ini kunjungan pertama? B: Ya. Saya demam sejak kemarin. A: Kalau begitu, tuliskan nama dan nomor telepon Anda di formulir ini.',30,2);

-- ===== QUESTIONS =====
insert into public.questions (id, level, skill, kind, prompt, prompt_note, choices, correct_index, explanation_id, passage_id, listening_id, source, is_published) values
('33333333-3333-4333-8333-333333333301','N5','kanji','multiple_choice','Bagaimana cara baca 「水」?',null,'["みず","ひ","つき","ほん"]',0,'「水」 dibaca みず dan berarti air.',null,null,'eno_original',true),
('33333333-3333-4333-8333-333333333302','N5','kanji','multiple_choice','Kanji mana yang berarti "buku"?',null,'["本","月","火","人"]',0,'「本」 berarti buku atau asal.',null,null,'eno_original',true),
('33333333-3333-4333-8333-333333333303','N5','vocabulary','multiple_choice','Apa arti 「行く」?',null,'["pergi","makan","membaca","tidur"]',0,'行く (いく) berarti pergi.',null,null,'eno_original',true),
('33333333-3333-4333-8333-333333333304','N5','grammar','multiple_choice','Lengkapi: 日本へ行き____です。',null,'["たい"," たら","ながら","ばかり"]',0,'〜たいです menyatakan keinginan.',null,null,'eno_original',true),
('33333333-3333-4333-8333-333333333305','N4','vocabulary','multiple_choice','Apa arti 「約束」?',null,'["janji","laporan","hak","pengalaman"]',0,'約束 (やくそく) berarti janji.',null,null,'eno_original',true),
('33333333-3333-4333-8333-333333333306','N4','grammar','multiple_choice','Lengkapi: 漢字を書く____できます。',null,'["ことが","ものが","ようが","ところが"]',0,'〜ことができる menyatakan kemampuan.',null,null,'eno_original',true),
('33333333-3333-4333-8333-333333333307','N3','vocabulary','multiple_choice','Apa arti 「経験」?',null,'["pengalaman","kualifikasi","laporan","hak"]',0,'経験 (けいけん) berarti pengalaman.',null,null,'eno_original',true),
('33333333-3333-4333-8333-333333333308','N5','reading','multiple_choice','Pukul berapa penulis bangun setiap pagi?',null,'["Pukul enam","Pukul tujuh","Pukul delapan","Pukul sembilan"]',0,'Kalimat pertama menyebut 六時に おきます.','11111111-1111-4111-8111-111111111101',null,'eno_original',true),
('33333333-3333-4333-8333-333333333309','N5','reading','multiple_choice','Apa yang dilakukan penulis pada malam hari?',null,'["Belajar bahasa Jepang","Menonton TV","Bekerja","Berolahraga"]',0,'Disebut よるは 一時間 日本語を べんきょうします.','11111111-1111-4111-8111-111111111101',null,'eno_original',true),
('33333333-3333-4333-8333-333333333310','N4','reading','multiple_choice','Kapan perpustakaan buka kembali seperti biasa?',null,'["Kamis","Senin","Rabu","Minggu"]',0,'Teks menyebut 木曜日からは いつも どおり.','11111111-1111-4111-8111-111111111102',null,'eno_original',true),
('33333333-3333-4333-8333-333333333311','N4','reading','multiple_choice','Bagaimana cara mengembalikan buku selama renovasi?',null,'["Lewat kotak pengembalian di pintu masuk","Lewat pos","Menunggu sampai buka","Melalui petugas di lantai dua"]',0,'返却ボックスを 使って ください.','11111111-1111-4111-8111-111111111102',null,'eno_original',true),
('33333333-3333-4333-8333-333333333312','N5','listening','listening_choice','Apakah kereta itu menuju Stasiun Tokyo?',null,'["Tidak, harus naik kereta berikutnya","Ya, langsung sampai","Ya, tetapi harus ganti kereta","Tidak tahu"]',0,'B menjawab いいえ、行きません dan menyarankan kereta berikutnya.',null,'22222222-2222-4222-8222-222222222201','eno_original',true),
('33333333-3333-4333-8333-333333333313','N4','listening','listening_choice','Apa yang harus ditulis pasien pada formulir?',null,'["Nama dan nomor telepon","Alamat dan umur","Nama dokter","Nomor kamar"]',0,'名前と 電話番号を 書いて ください.',null,'22222222-2222-4222-8222-222222222202','eno_original',true);

-- ===== QUIZZES =====
insert into public.quizzes (id, level, slug, title, description, skill, question_count, time_limit_seconds, source, is_published, sort_order) values
('44444444-4444-4444-8444-444444444401','N5','kuis-kanji-n5','Kuis Kanji N5','Latihan bacaan dan arti kanji dasar.','kanji',2,null,'eno_original',true,1),
('44444444-4444-4444-8444-444444444402','N5','kuis-kotoba-n5','Kuis Kotoba N5','Latihan kosakata dasar sehari-hari.','vocabulary',1,null,'eno_original',true,2),
('44444444-4444-4444-8444-444444444403','N4','kuis-bunpo-n4','Kuis Bunpo N4','Latihan pola kalimat tingkat N4.','grammar',1,null,'eno_original',true,3),
('44444444-4444-4444-8444-444444444404','N5','kuis-dokkai-n5','Kuis Dokkai N5','Pemahaman bacaan pendek.','reading',2,null,'eno_original',true,4),
('44444444-4444-4444-8444-444444444405','N5','kuis-choukai-n5','Kuis Choukai N5','Latihan menyimak percakapan pendek.','listening',1,null,'eno_original',true,5),
('44444444-4444-4444-8444-444444444406','N5','simulasi-jlpt-n5','Simulasi JLPT N5 (Demo)','Simulasi bergaya JLPT: Moji-Goi/Bunpo, Dokkai, dan Choukai. Soal original ENO JAPAN.','vocabulary',6,1800,'eno_original',true,10);

insert into public.quiz_questions (quiz_id, question_id, sort_order) values
('44444444-4444-4444-8444-444444444401','33333333-3333-4333-8333-333333333301',1),
('44444444-4444-4444-8444-444444444401','33333333-3333-4333-8333-333333333302',2),
('44444444-4444-4444-8444-444444444402','33333333-3333-4333-8333-333333333303',1),
('44444444-4444-4444-8444-444444444403','33333333-3333-4333-8333-333333333306',1),
('44444444-4444-4444-8444-444444444404','33333333-3333-4333-8333-333333333308',1),
('44444444-4444-4444-8444-444444444404','33333333-3333-4333-8333-333333333309',2),
('44444444-4444-4444-8444-444444444405','33333333-3333-4333-8333-333333333312',1),
('44444444-4444-4444-8444-444444444406','33333333-3333-4333-8333-333333333301',1),
('44444444-4444-4444-8444-444444444406','33333333-3333-4333-8333-333333333303',2),
('44444444-4444-4444-8444-444444444406','33333333-3333-4333-8333-333333333304',3),
('44444444-4444-4444-8444-444444444406','33333333-3333-4333-8333-333333333308',4),
('44444444-4444-4444-8444-444444444406','33333333-3333-4333-8333-333333333309',5),
('44444444-4444-4444-8444-444444444406','33333333-3333-4333-8333-333333333312',6);
