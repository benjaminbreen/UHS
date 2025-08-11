/**
 * constants/characterData/names.ts - Comprehensive data for procedural name generation.
 */
export type CulturalZone = 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';

export interface NameList {
    male: string[];
    female: string[];
    surname: string[];
}

export interface NameGenerationOptions {
    allowNoSurname?: boolean;
    preferCommonNames?: boolean;
    historicalPeriod?: 'antiquity' | 'early_medieval' | 'high_medieval' | 'late_medieval' | 'renaissance' | 'early_modern' | 'industrial' | 'modern';
}

export const CHARACTER_NAMES: Record<string, NameList> = {
    // === ANCIENT & CLASSICAL ===
    ANCIENT_GREEK: {
        male: ['Lykos', 'Leon', 'Heron', 'Damon', 'Alexios', 'Nikandros', 'Philippos', 'Apollodoros', 'Dionysios', 'Herakleitos', 'Kleomenes', 'Lysander', 'Menandros', 'Nikias', 'Perikles', 'Sokrates', 'Theophrastos', 'Xenophanes', 'Zenodoros', 'Aristophanes'],
        female: ['Kassandra', 'Helene', 'Penelope', 'Chloe', 'Daphne', 'Phoebe', 'Arete', 'Kallisto', 'Myrrine', 'Aspasia', 'Xanthippe', 'Gorgo', 'Cynisca', 'Diotima', 'Theano', 'Aglaonike', 'Timycha', 'Lasthenia', 'Axiothea', 'Phaedra'],
        surname: ['of Athens', 'of Sparta', 'of Corinth', 'of Thebes', 'of Miletos', 'of Argos', 'the Macedonian', 'the Theban', 'the Athenian', 'the Spartan']
    },
    ANCIENT_ROMAN: {
        male: ['Gaius', 'Lucius', 'Marcus', 'Publius', 'Quintus', 'Tiberius', 'Aulus', 'Sextus', 'Decimus', 'Gnaeus', 'Spurius', 'Appius', 'Numerius', 'Manius', 'Kaeso', 'Titus', 'Servius', 'Caeso', 'Volusus', 'Hostus'],
        female: ['Livia', 'Julia', 'Cornelia', 'Octavia', 'Aemilia', 'Claudia', 'Valeria', 'Fabia', 'Horatia', 'Junia', 'Antonia', 'Caecilia', 'Domitia', 'Fulvia', 'Pompeia', 'Servilia', 'Tullia', 'Vipsania', 'Agrippina', 'Messalina'],
        surname: ['Antonius', 'Cornelius', 'Fabius', 'Julius', 'Valerius', 'Claudius', 'Aemilius', 'Domitius', 'Flavius', 'Cassius', 'Junius', 'Caecilius', 'Hortensius', 'Licinius', 'Marcius', 'Scribonius', 'Sulpicius', 'Terentius', 'Tullius', 'Vibius']
    },

    // === FRANKISH/EARLY MEDIEVAL FRENCH ===
    FRANKISH_MEROVINGIAN: {
        male: ['Chlodovech', 'Childebert', 'Clotaire', 'Dagobert', 'Sigebert', 'Chilperic', 'Theudebert', 'Guntram', 'Charibert', 'Theuderic', 'Brunulphe', 'Wandregisel', 'Audoin', 'Berchar', 'Grimoald', 'Waratto', 'Ghislemar', 'Ansbert', 'Droctulf', 'Godegisel'],
        female: ['Brunhild', 'Fredegund', 'Radegund', 'Clotilde', 'Bathilde', 'Nanthilde', 'Bilichilde', 'Vuldetrade', 'Arnegunde', 'Ingoberge', 'Audovera', 'Galswinthe', 'Theudechilde', 'Bertrude', 'Anstrude', 'Begga', 'Gertrude', 'Itta', 'Aldegunde', 'Wulfgunde'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    FRANKISH_CAROLINGIAN: {
        male: ['Karl', 'Pippin', 'Karlmann', 'Ludwig', 'Lothar', 'Adalbert', 'Eberhard', 'Gerold', 'Hildebrand', 'Nithard', 'Angilbert', 'Einhard', 'Alcuin', 'Rabanus', 'Wala', 'Adalhard', 'Drogo', 'Hugo', 'Odo', 'Rudolf'],
        female: ['Hildegard', 'Bertrada', 'Liutgard', 'Fastrada', 'Ermengarde', 'Judith', 'Engelberge', 'Richildis', 'Irmengard', 'Gisela', 'Bertha', 'Rotrude', 'Adalheid', 'Cunigunde', 'Hemma', 'Matilda', 'Edgitha', 'Gerberga', 'Adelheid', 'Emma'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    NORMAN_FRENCH: {
        male: ['Guillaume', 'Robert', 'Richard', 'Henri', 'Hugues', 'Gautier', 'Roger', 'Raoul', 'Godefroy', 'Baudouin', 'Foulques', 'Drogon', 'Gilbert', 'Eudes', 'Etienne', 'Alain', 'Geoffroy', 'Raoul', 'Etienne', 'Tancrede'],
        female: ['Mathilde', 'Judith', 'Emma', 'Adele', 'Agnes', 'Constance', 'Herleve', 'Sibille', 'Gundrade', 'Isabelle', 'Alix', 'Beatrice', 'Cecile', 'Alienor', 'Giselle', 'Havoise', 'Muriel', 'Orabile', 'Richilde', 'Sybille'],
        surname: ['de Montfort', 'de Beaumont', 'de Clare', 'de Warenne', 'Giffard', "d'Ivry", 'de Conteville', 'FitzRobert', 'FitzGilbert', 'de Montbray', 'de Lacy', 'de Mandeville', 'de Tosny', 'de Mortemer', 'de Courcy', 'de Braose', 'de Mowbray', 'de Vere', 'de Ferrers', 'de Redvers']
    },
    FRENCH_MEDIEVAL: {
        male: ['Guillaume', 'Jean', 'Pierre', 'Louis', 'Charles', 'Philippe', 'Henri', 'Antoine', 'Michel', 'Francois', 'Andre', 'Nicolas', 'Claude', 'Bernard', 'Etienne', 'Gilles', 'Thibaut', 'Arnaud', 'Bertrand', 'Remi'],
        female: ['Marie', 'Jeanne', 'Marguerite', 'Catherine', 'Isabelle', 'Louise', 'Anne', 'Francoise', 'Agnes', 'Blanche', 'Constance', 'Helene', 'Mathilde', 'Simone', 'Perronnelle', 'Ameline', 'Aveline', 'Denise', 'Jacqueline', 'Mahaut'],
        surname: ['le Roi', 'le Comte', 'le Duc', 'de Paris', 'de Lyon', 'de Rouen', 'le Clerc', 'le Boucher', 'le Boulanger', 'le Tisserand', 'le Forgeron', 'le Meunier', 'le Charpentier', 'le Marchand', 'le Chevalier', 'le Pretre', 'de la Fontaine', 'du Bois', 'de la Pierre', 'le Blanc']
    },

    // === HISTORICAL PERIODS FOR EXISTING CULTURES ===
    ENGLISH_ANGLO_SAXON: {
        male: ['Aelfric', 'Aethelred', 'Aethelstan', 'Beornwulf', 'Cenwulf', 'Cynric', 'Dunstan', 'Eadmund', 'Eadwig', 'Godwin', 'Leofric', 'Oswald', 'Sigered', 'Wulfric', 'Aelfgar', 'Beorhtric', 'Ceolwulf', 'Eadric', 'Godric', 'Wulfstan'],
        female: ['Aelfgifu', 'Aethelflaed', 'Eadgyth', 'Godgifu', 'Wulfhild', 'Aethelburh', 'Cwenthryth', 'Eadburh', 'Hild', 'Leofgyth', 'Aelfwyn', 'Cyneburh', 'Ealhswith', 'Gunnhild', 'Thyra', 'Aetheldreda', 'Cynewise', 'Eadgyth', 'Mildrith', 'Sexburh'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    ENGLISH_MEDIEVAL: {
        male: ['John', 'William', 'Thomas', 'Robert', 'Richard', 'Henry', 'Walter', 'Roger', 'Geoffrey', 'Ralph', 'Hugh', 'Gilbert', 'Alan', 'Stephen', 'Adam', 'Nicholas', 'Simon', 'Peter', 'Alexander', 'Edmund'],
        female: ['Alice', 'Emma', 'Matilda', 'Agnes', 'Joan', 'Margaret', 'Isabella', 'Juliana', 'Margery', 'Cecily', 'Avice', 'Beatrice', 'Christine', 'Ellen', 'Katherine', 'Lucy', 'Maud', 'Petronilla', 'Rose', 'Sibyl'],
        surname: ['atte Hill', 'atte Wood', 'atte Water', 'le Smith', 'le Baker', 'le Miller', 'le Cook', 'le Taylor', 'le Wright', 'le Mason', 'le Cooper', 'le Fletcher', 'le Turner', 'le Parker', 'de la Mare', 'de la Ford', 'de la Grove', 'de Clifford', 'de Montfort', 'de Beaumont']
    },
    ENGLISH: {
        male: ['John', 'William', 'Thomas', 'Robert', 'James', 'Richard', 'Edward', 'Henry', 'Walter', 'Roger', 'Bartholomew', 'Geoffrey', 'Edmund', 'Stephen', 'Nicholas', 'Christopher', 'Alexander', 'Michael', 'Anthony', 'Peter', 'Charles', 'Francis', 'Arthur', 'Frederick', 'George', 'Harold', 'Ralph', 'Philip', 'Mark', 'Matthew'],
        female: ['Mary', 'Elizabeth', 'Anne', 'Eleanor', 'Margaret', 'Alice', 'Joan', 'Isabella', 'Matilda', 'Catherine', 'Beatrice', 'Agnes', 'Jane', 'Sarah', 'Emma', 'Grace', 'Rose', 'Helen', 'Victoria', 'Florence', 'Charlotte', 'Sophia', 'Diana', 'Rebecca', 'Rachel', 'Judith', 'Caroline', 'Frances', 'Arabella', 'Cordelia'],
        surname: ['Smith', 'Baker', 'Cook', 'Taylor', 'Miller', 'Hill', 'Green', 'Carter', 'Wright', 'Mason', 'Cooper', 'Fletcher', 'Turner', 'Parker', 'Brown', 'Davis', 'Wilson', 'Moore', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Scott', 'Adams', 'Campbell', 'Mitchell', 'Roberts', 'Phillips', 'Evans']
    },

    // === REGIONAL TEXAS NAMES ===
    TEXAS_SPANISH_COLONIAL: {
        male: ['Antonio', 'Miguel', 'José', 'Francisco', 'Juan', 'Pedro', 'Manuel', 'Carlos', 'Luis', 'Fernando', 'Diego', 'Alejandro', 'Domingo', 'Gonzalo', 'Hernando', 'Ignacio', 'Joaquín', 'Lorenzo', 'Nicolás', 'Rafael'],
        female: ['María', 'Ana', 'Isabel', 'Catalina', 'Juana', 'Teresa', 'Rosa', 'Carmen', 'Dolores', 'Esperanza', 'Francisca', 'Guadalupe', 'Inés', 'Josefa', 'Lucia', 'Margarita', 'Natalia', 'Patricia', 'Soledad', 'Victoria'],
        surname: ['de León', 'Hernández', 'García', 'Martínez', 'Rodríguez', 'González', 'López', 'Sánchez', 'Pérez', 'Ramírez', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Reyes', 'Morales', 'Gutiérrez', 'Jiménez', 'Ruiz']
    },
    TEXAS_ANGLO: {
        male: ['Stephen', 'Austin', 'Sam', 'Houston', 'James', 'William', 'Moses', 'Josiah', 'Jared', 'Green', 'DeWitt', 'Martin', 'Robert', 'John', 'Thomas', 'Edward', 'Benjamin', 'Joseph', 'David', 'Andrew'],
        female: ['Mary', 'Elizabeth', 'Sarah', 'Margaret', 'Jane', 'Nancy', 'Rebecca', 'Martha', 'Emily', 'Lucy', 'Susanna', 'Caroline', 'Harriet', 'Frances', 'Charlotte', 'Eleanor', 'Catherine', 'Anne', 'Rachel', 'Judith'],
        surname: ['Austin', 'Houston', 'Travis', 'Bowie', 'Crockett', 'Fannin', 'Lamar', 'Burnet', 'Rusk', 'Jones', 'Smith', 'Brown', 'Williams', 'Johnson', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson']
    },
    
    // === SWAHILI COAST ===
    SWAHILI: {
        male: ['Musa', 'Ali', 'Hassan', 'Omar', 'Yusuf', 'Ibrahim', 'Hamza', 'Juma', 'Salim', 'Bakari', 'Hamisi', 'Sefu', 'Zuberi', 'Jabari', 'Rashidi', 'Faraji', 'Daudi', 'Amani', 'Baraka', 'Kipenda'],
        female: ['Fatima', 'Aisha', 'Zainab', 'Maryam', 'Halima', 'Khadija', 'Amina', 'Safia', 'Rukia', 'Salma', 'Jamila', 'Asha', 'Dalila', 'Hasina', 'Layla', 'Naima', 'Penda', 'Shani', 'Tatu', 'Zawadi'],
        surname: ['bin Said', 'al-Shirazi', 'al-Kilwa', 'bin Hassan', 'al-Mogadishu', 'bin Omar', 'al-Barawi', 'bin Yusuf', 'al-Pemba', 'bin Ali', 'al-Lamu', 'bin Rashid', 'al-Mombasa', 'bin Hamza', 'al-Zanzibar', 'bin Salim', 'al-Pate', 'bin Juma', 'al-Malindi', 'bin Bakari']
    },
    
    // === ARABIAN PENINSULA ===
    ARABIAN_HEJAZ: {
        male: ['Muhammad', 'Ahmad', 'Abdullah', 'Ali', 'Umar', 'Uthman', 'Abu Bakr', 'Hassan', 'Hussein', 'Khalid', 'Saad', 'Amr', 'Bilal', 'Hamza', 'Abbas', 'Jafar', 'Talha', 'Zubair', 'Abdul Rahman', 'Abdul Aziz'],
        female: ['Khadija', 'Aisha', 'Fatima', 'Hafsa', 'Zainab', 'Umm Salama', 'Ruqayyah', 'Safiyya', 'Maryam', 'Asma', 'Hind', 'Lubna', 'Sumayyah', 'Nusaybah', 'Ramlah', 'Sawda', 'Maymunah', 'Juwayriyah', 'Safiyya', 'Rayhana'],
        surname: ['al-Qurashi', 'al-Hashimi', 'al-Makki', 'al-Madani', 'al-Taifi', 'al-Ansari', 'al-Muhajir', 'al-Adnani', 'al-Qahtani', 'al-Azdi', 'al-Tamimi', 'al-Asadi', 'al-Kinani', 'al-Ghatafani', 'al-Judhami', 'al-Khuza\'i', 'al-Thaqafi', 'al-Hawazini', 'al-Sulami', 'al-Muzani']
    },
    
    // === CENTRAL AFRICAN HIGHLANDS ===
    RWANDA_BURUNDI: {
        male: ['Mutara', 'Kigeli', 'Yuhi', 'Cyilima', 'Mibambwe', 'Gahindiro', 'Rwabugiri', 'Musinga', 'Rudahigwa', 'Ndahindurwa', 'Semugeshi', 'Gahiji', 'Nsoro', 'Samembe', 'Ruganzu', 'Cyamatare', 'Rwaka', 'Ruregeya', 'Kimenyi', 'Sekarama'],
        female: ['Nyiramavugo', 'Nyiramongi', 'Nyabunyana', 'Kanjogera', 'Murorunkwere', 'Nyiratunga', 'Nyirakigeri', 'Musabyimana', 'Mukamusoni', 'Mukamwezi', 'Mukabalisa', 'Nyiramacibiri', 'Rwogera', 'Mukandamage', 'Nyiranzeyimana', 'Mukagatare', 'Nyirakabwa', 'Mukabayire', 'Nyirahabimana', 'Mukarutesi'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === NUBIAN ===
    NUBIAN: {
        male: ['Taharqa', 'Piye', 'Shabaka', 'Shebitku', 'Tantamani', 'Kashta', 'Alara', 'Anlamani', 'Aspelta', 'Arikamani', 'Arkamani', 'Amanislo', 'Amanineteyerike', 'Teqorideamani', 'Nastasen', 'Harsiotef', 'Amannote', 'Baskakeren', 'Malewiebamani', 'Talakhamani'],
        female: ['Amenirdis', 'Shepenupet', 'Karimala', 'Peksater', 'Khensa', 'Abar', 'Qalhata', 'Takahatenamun', 'Naparaye', 'Sakhmakh', 'Nasalsa', 'Madiqen', 'Amanishakheto', 'Amanitore', 'Amanirenas', 'Shanakdakhete', 'Nawidemak', 'Maleqorobar', 'Amanikhatashan', 'Amanikhabale'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === PERSIAN KHORASAN ===
    PERSIAN_KHORASAN: {
        male: ['Ferdowsi', 'Omar', 'Rumi', 'Hafez', 'Saadi', 'Nizam', 'Attar', 'Sanai', 'Rudaki', 'Daqiqi', 'Asadi', 'Anvari', 'Khaqani', 'Nezami', 'Jami', 'Nasir', 'Biruni', 'Avicenna', 'Rhazes', 'Tusi'],
        female: ['Rabia', 'Mahsati', 'Jahan', 'Mehri', 'Parvin', 'Forough', 'Simin', 'Tahereh', 'Bibi', 'Khadijeh', 'Zahra', 'Maryam', 'Fatimah', 'Golnar', 'Shirin', 'Leyla', 'Pari', 'Soraya', 'Roxana', 'Goli'],
        surname: ['Tusi', 'Khorasani', 'Balkhi', 'Samarqandi', 'Bukhari', 'Mervi', 'Heravi', 'Nishapuri', 'Ghazni', 'Sistan', 'Kashani', 'Razi', 'Isfahani', 'Shirazi', 'Yazdi', 'Kermani', 'Tabrizi', 'Qazvin', 'Mashhadi', 'Sabzevari']
    },
    
    // === TRANSYLVANIA ===
    TRANSYLVANIAN: {
        male: ['István', 'László', 'János', 'Béla', 'András', 'Mihály', 'György', 'Ferenc', 'Péter', 'Mátyás', 'Gábor', 'Zsigmond', 'Bálint', 'Tamás', 'Vlad', 'Radu', 'Mircea', 'Constantin', 'Alexandru', 'Ștefan'],
        female: ['Erzsébet', 'Katalin', 'Anna', 'Mária', 'Ilona', 'Zsuzsanna', 'Klára', 'Borbála', 'Margit', 'Ágnes', 'Dorottya', 'Judit', 'Elena', 'Maria', 'Ana', 'Ioana', 'Elisabeta', 'Ecaterina', 'Sofia', 'Alexandra'],
        surname: ['Báthory', 'Hunyadi', 'Corvinus', 'Bethlen', 'Rákóczi', 'Bocskai', 'Thököly', 'Apafi', 'Kemény', 'Barcsay', 'Szapolyai', 'Drăculești', 'Basarab', 'Brâncoveanu', 'Cantacuzino', 'Ghica', 'Movilă', 'Rareș', 'Mușat', 'Bogdan']
    },
    
    // === GALICIAN ===
    GALICIAN: {
        male: ['Xosé', 'Manuel', 'Antonio', 'Francisco', 'Ramón', 'Pedro', 'Xulio', 'Carlos', 'Luis', 'Diego', 'Afonso', 'Sancho', 'García', 'Fernando', 'Rodrigo', 'Álvaro', 'Paio', 'Nuno', 'Mendo', 'Vasco'],
        female: ['María', 'Carmen', 'Ana', 'Isabel', 'Teresa', 'Dolores', 'Rosa', 'Lucía', 'Beatriz', 'Elvira', 'Urraca', 'Sancha', 'Mayor', 'Constanza', 'Inés', 'Leonor', 'Berenguela', 'Jimena', 'Aldonza', 'Guiomar'],
        surname: ['Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'García', 'Díaz', 'Vázquez', 'Castro', 'Ponte', 'Saavedra', 'Andrade', 'Ulloa', 'Lemos', 'Osorio', 'Quiroga', 'Ribera']
    },
    
    // === IMPROVED NATIVE AMERICAN NAMES ===
    NORTH_AMERICAN_ALGONQUIAN: {
        male: ['Nanabozho', 'Wabigwan', 'Makoons', 'Migizi', 'Giizhig', 'Binesi', 'Makak', 'Waabigwanii', 'Ogichidaa', 'Gichi', 'Migwech', 'Anishinaabe', 'Boozhoo', 'Giwedin', 'Ishkode', 'Manidoo', 'Miigwech', 'Nooko', 'Ozhaawashko', 'Waaboos'],
        female: ['Nokomis', 'Waabigwanii', 'Ogichidaakwe', 'Migizi', 'Giizhigokwe', 'Binesi', 'Makoons', 'Waabigwan', 'Anishinaabekwe', 'Gichigami', 'Ishkodekwe', 'Manidookwe', 'Miigwech', 'Nookookwe', 'Ozhaawashko', 'Waaboos', 'Giiwedin', 'Migwech', 'Boozhoo', 'Wabana'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    IROQUOIAN: {
        male: ['Kanienke', 'Tekeni', 'Ase', 'Kaieri', 'Wisk', 'Iaiak', 'Sata', 'Sekso', 'Tiohton', 'Oiere', 'Ratirihwakete', 'Ronkwetakete', 'Kawennata', 'Karonhiake', 'Tekariwaien', 'Aiontat', 'Ohonte', 'Rawenniio', 'Sakoiatison', 'Tekanawita'],
        female: ['Ienokenra', 'Kahentanetha', 'Konwatawenhawe', 'Rawennio', 'Teharonhiawagon', 'Wahyonhientha', 'Yontocket', 'Kistahpinanihk', 'Ohwentsia', 'Kanienke', 'Tekeni', 'Ase', 'Kaieri', 'Wisk', 'Iaiak', 'Sata', 'Sekso', 'Tiohton', 'Oiere', 'Kahionhes'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    PUEBLO: {
        male: ['Ahote', 'Aiakos', 'Ezhno', 'Hakan', 'Helaku', 'Honaw', 'Hototo', 'Istu', 'Kele', 'Kiva', 'Lomahongva', 'Masauwu', 'Naalnish', 'Paco', 'Sakima', 'Tahoma', 'Tuwa', 'Wilu', 'Yaotl', 'Yuma'],
        female: ['Aiyana', 'Akina', 'Chapa', 'Chumani', 'Dyani', 'Enola', 'Halona', 'Huyana', 'Istas', 'Kachina', 'Kimama', 'Leotie', 'Mitena', 'Nantai', 'Orenda', 'Pocahontas', 'Shada', 'Tala', 'Winona', 'Yanaba'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    PLAINS_NATIVE: {
        male: ['Chayton', 'Ezhno', 'Hakan', 'Kuruk', 'Nantan', 'Pachu', 'Sani', 'Takoda', 'Wapi', 'Aiukli', 'Bidziil', 'Dibe', 'Gad', 'Hosteen', 'Naalnish', 'Ahiga', 'Chaytan', 'Elan', 'Honiahaka', 'Kangee', 'Napayshni', 'Otaktay', 'Sicheii', 'Tokala', 'Wambli', 'Mahpe', 'Tatanka', 'Wicahpi', 'Takala', 'Ohanzee'],
        female: ['Aiyana', 'Chenoa', 'Dyani', 'Halona', 'Imala', 'Kachina', 'Leotie', 'Nayeli', 'Orenda', 'Papina', 'Sacnite', 'Taini', 'Weeko', 'Aponi', 'Chickoa', 'Enola', 'Haloke', 'Istas', 'Kimama', 'Migina', 'Nita', 'Shada', 'Tala', 'Winona', 'Zitkala', 'Mahpe', 'Ptesanwi', 'Wicahpi', 'Takala', 'Ohanzee'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // === CONTINUE WITH EXISTING CULTURES (keeping the good ones as-is) ===
    SPANISH_CASTILIAN: {
        male: ['Diego', 'Javier', 'Carlos', 'Miguel', 'Alejandro', 'Francisco', 'Hernán', 'Mateo', 'Santiago', 'Pablo', 'Eduardo', 'Fernando', 'Rafael', 'Andrés', 'Manuel', 'Sebastián', 'Gonzalo', 'Emilio', 'Ramón', 'Vicente', 'Joaquín', 'Ignacio', 'Lorenzo', 'Salvador', 'Esteban', 'Agustín', 'Nicolás', 'Patricio', 'Teodoro', 'Cristóbal'],
        female: ['Isabella', 'Sofia', 'Camila', 'Valentina', 'Lucia', 'Maria', 'Elena', 'Ximena', 'Carmen', 'Esperanza', 'Dolores', 'Mercedes', 'Pilar', 'Rosario', 'Consuelo', 'Amparo', 'Remedios', 'Concepción', 'Asunción', 'Inmaculada', 'Soledad', 'Milagros', 'Angeles', 'Encarnación', 'Fernanda', 'Gabriela', 'Beatriz', 'Cristina', 'Margarita', 'Catalina'],
        surname: ['García', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Cruz', 'Flores', 'Gomez', 'Morales', 'Vargas', 'Castillo', 'Jimenez', 'Ruiz', 'Diaz', 'Moreno', 'Herrera', 'Medina', 'Aguilar', 'Gutierrez', 'Contreras', 'Mendoza', 'Ortega', 'Silva', 'Romero', 'Guerrero', 'Vega']
    },
    SPANISH_LATIN_AMERICAN: {
        male: ['Mateo', 'Santiago', 'Alejandro', 'Sebastián', 'Diego', 'Nicolás', 'Emiliano', 'Joaquín', 'Gabriel', 'Daniel', 'Javier', 'Carlos', 'Fernando', 'Ricardo', 'Arturo', 'Hector', 'Oscar', 'Raul', 'Sergio', 'Ivan'],
        female: ['Camila', 'Sofía', 'Valentina', 'Isabella', 'Mariana', 'Gabriela', 'Daniela', 'Valeria', 'Ximena', 'Renata', 'Alejandra', 'Carolina', 'Paulina', 'Adriana', 'Victoria', 'Natalia', 'Andrea', 'Liliana', 'Patricia', 'Veronica'],
        surname: ['Hernandez', 'Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Flores', 'Gomez', 'Diaz', 'Vasquez', 'Rojas', 'Reyes', 'Mendoza', 'Castillo', 'Cruz', 'Morales', 'Vargas', 'Silva']
    },
    PORTUGUESE: {
        male: ['João', 'Pedro', 'Afonso', 'Diogo', 'Vasco', 'Gonçalo', 'Nuno', 'Rui', 'António', 'Manuel', 'Francisco', 'José', 'Carlos', 'Miguel', 'Luís', 'Paulo', 'Ricardo', 'André', 'Bruno', 'Tiago', 'Rafael', 'Hugo', 'Marco', 'Sérgio', 'Vítor', 'Jorge', 'Mário', 'Henrique', 'Rodrigo', 'Fernando'],
        female: ['Maria', 'Leonor', 'Beatriz', 'Catarina', 'Inês', 'Isabel', 'Teresa', 'Joana', 'Ana', 'Sofia', 'Carolina', 'Patrícia', 'Cláudia', 'Cristina', 'Sandra', 'Paula', 'Carla', 'Sónia', 'Helena', 'Marta', 'Susana', 'Fernanda', 'Manuela', 'Conceição', 'Graça', 'Fátima', 'Rosa', 'Alice', 'Margarida', 'Esperança'],
        surname: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira', 'Monteiro', 'Cardoso', 'Rocha']
    },
    PORTUGUESE_BRAZIL: {
        male: ['Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Davi', 'Gabriel', 'Pedro', 'Lucas', 'Matheus', 'Enzo', 'Guilherme', 'Samuel', 'Felipe', 'Gustavo', 'Rafael', 'João', 'Daniel', 'Vitor', 'Leonardo', 'Henrique'],
        female: ['Alice', 'Sophia', 'Helena', 'Valentina', 'Laura', 'Isabella', 'Manuela', 'Júlia', 'Heloísa', 'Luiza', 'Maria', 'Lívia', 'Giovanna', 'Beatriz', 'Mariana', 'Yasmin', 'Gabriela', 'Rafaela', 'Larissa', 'Beatriz'],
        surname: ['da Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa']
    },
    ITALIAN: {
        male: ['Giovanni', 'Marco', 'Lorenzo', 'Antonio', 'Leonardo', 'Francesco', 'Matteo', 'Alessandro', 'Andrea', 'Giuseppe', 'Stefano', 'Roberto', 'Massimo', 'Federico', 'Simone', 'Davide', 'Luca', 'Paolo', 'Fabio', 'Claudio', 'Sergio', 'Carlo', 'Enrico', 'Riccardo', 'Tommaso', 'Michele', 'Vincenzo', 'Emanuele', 'Gabriele', 'Raffaele'],
        female: ['Giulia', 'Sofia', 'Aurora', 'Alice', 'Beatrice', 'Francesca', 'Chiara', 'Martina', 'Giorgia', 'Sara', 'Emma', 'Greta', 'Vittoria', 'Camilla', 'Matilde', 'Noemi', 'Elena', 'Elisabetta', 'Federica', 'Valentina', 'Alessandra', 'Silvia', 'Paola', 'Laura', 'Cristina', 'Monica', 'Anna', 'Roberta', 'Emanuela', 'Daniela'],
        surname: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone']
    },
    FRENCH: {
        male: ['Jean', 'Pierre', 'Louis', 'Charles', 'Guillaume', 'Philippe', 'Henri', 'Antoine', 'Michel', 'François', 'André', 'Nicolas', 'Claude', 'Bernard', 'Marcel', 'René', 'Paul', 'Robert', 'Jacques', 'Alain', 'Gérard', 'Yves', 'Christian', 'Thierry', 'Daniel', 'Patrick', 'Pascal', 'Olivier', 'Sébastien', 'Étienne'],
        female: ['Marie', 'Jeanne', 'Marguerite', 'Catherine', 'Isabelle', 'Louise', 'Anne', 'Françoise', 'Monique', 'Sylvie', 'Nicole', 'Christine', 'Brigitte', 'Martine', 'Chantal', 'Véronique', 'Nathalie', 'Sandrine', 'Valérie', 'Céline', 'Stéphanie', 'Virginie', 'Aurélie', 'Émilie', 'Caroline', 'Julie', 'Laure', 'Mathilde', 'Claire', 'Camille'],
        surname: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefevre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez']
    },
    GERMAN: {
        male: ['Johann', 'Wilhelm', 'Friedrich', 'Heinrich', 'Karl', 'Ludwig', 'Franz', 'Georg', 'Christian', 'Rudolf', 'Otto', 'Ernst', 'Hans', 'Werner', 'Klaus', 'Günter', 'Dieter', 'Helmut', 'Wolfgang', 'Manfred', 'Peter', 'Michael', 'Thomas', 'Andreas', 'Stefan', 'Markus', 'Alexander', 'Sebastian', 'Florian', 'Maximilian'],
        female: ['Anna', 'Maria', 'Elisabeth', 'Margarete', 'Gertrude', 'Emma', 'Bertha', 'Martha', 'Frieda', 'Marie', 'Helga', 'Ingrid', 'Ursula', 'Monika', 'Brigitte', 'Renate', 'Gisela', 'Sabine', 'Petra', 'Andrea', 'Claudia', 'Stefanie', 'Nicole', 'Julia', 'Katharina', 'Sandra', 'Christina', 'Melanie', 'Nadine', 'Tanja'],
        surname: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier']
    },
    RUSSIAN: {
        male: ['Ivan', 'Vladimir', 'Dmitri', 'Sergei', 'Alexei', 'Mikhail', 'Andrei', 'Nikolai', 'Pavel', 'Konstantin', 'Boris', 'Viktor', 'Yuri', 'Oleg', 'Roman', 'Maxim', 'Artem', 'Igor', 'Evgeni', 'Denis', 'Stanislav', 'Vadim', 'Leonid', 'Gennadi', 'Anatoli', 'Vitali', 'Valeri', 'Ruslan', 'Fyodor', 'Georgi'],
        female: ['Olga', 'Irina', 'Elena', 'Natasha', 'Svetlana', 'Maria', 'Tatyana', 'Anna', 'Lyudmila', 'Galina', 'Nadezhda', 'Valentina', 'Nina', 'Anastasia', 'Vera', 'Oksana', 'Yulia', 'Ekaterina', 'Marina', 'Larisa', 'Alla', 'Tamara', 'Raisa', 'Zinaida', 'Lyubov', 'Yelena', 'Polina', 'Darya', 'Alina', 'Kira'],
        surname: ['Ivanov', 'Petrov', 'Sidorov', 'Smirnov', 'Kuznetsov', 'Popov', 'Volkov', 'Sokolov', 'Mikhailov', 'Fedorov', 'Morozov', 'Volkov', 'Alekseev', 'Lebedev', 'Semenov', 'Egorov', 'Pavlov', 'Kozlov', 'Stepanov', 'Nikolaev', 'Orlov', 'Andreev', 'Makarov', 'Nikitin', 'Antonov', 'Timofeev', 'Filippov', 'Yakovlev', 'Prokofiev', 'Sergeev']
    },
    GREEK: {
        male: ['Alexandros', 'Dimitrios', 'Konstantinos', 'Georgios', 'Ioannis', 'Nikolaos', 'Panagiotis', 'Christos', 'Vasileios', 'Michail', 'Antonios', 'Theodoros', 'Spyridon', 'Andreas', 'Athanasios', 'Stefanos', 'Apostolos', 'Evangelos', 'Eleftherios', 'Charalampos', 'Petros', 'Odysseus', 'Leonidas', 'Lysander', 'Theofilos', 'Aristides', 'Demetrius', 'Kyriakos', 'Socrates', 'Platon'],
        female: ['Maria', 'Eleni', 'Katerina', 'Dimitra', 'Sofia', 'Anastasia', 'Georgia', 'Konstantina', 'Ioanna', 'Vasiliki', 'Paraskevi', 'Chrysoula', 'Antonia', 'Sophia', 'Alexandra', 'Despina', 'Kalliopi', 'Fotini', 'Evangelia', 'Panagiota', 'Theodora', 'Angeliki', 'Irini', 'Stavroula', 'Olympia', 'Penelope', 'Cassandra', 'Helena', 'Athena', 'Aphrodite'],
        surname: ['Papadopoulos', 'Georgiou', 'Dimitriou', 'Konstantinou', 'Ioannou', 'Nikolaou', 'Petrou', 'Andreou', 'Christou', 'Michail', 'Stefanou', 'Karagiannis', 'Vasiliou', 'Oikonomou', 'Antoniou', 'Stavrou', 'Theodossiou', 'Alexandrou', 'Charalambous', 'Evangelou', 'Panayiotou', 'Demetriou', 'Athanassiou', 'Economou', 'Spyrou', 'Kostas', 'Makris', 'Vlachos', 'Pappas', 'Kostopoulos']
    },
    CELTIC_IRISH: {
        male: ['Seán', 'Liam', 'Conor', 'Cian', 'Aidan', 'Niall', 'Eoin', 'Oisín', 'Tadhg', 'Ruairí', 'Cillian', 'Darragh', 'Fionn', 'Ronan', 'Donnacha', 'Pádraig', 'Cormac', 'Brendan', 'Colm', 'Diarmuid', 'Eamon', 'Fergus', 'Ciarán', 'Lorcan', 'Muiris', 'Rían', 'Séamus', 'Cathal', 'Donal', 'Finn'],
        female: ['Aoife', 'Ciara', 'Niamh', 'Aisling', 'Sinéad', 'Caoimhe', 'Orla', 'Saoirse', 'Clodagh', 'Róisín', 'Ailbhe', 'Gráinne', 'Méabh', 'Siobhán', 'Muirenn', 'Brigid', 'Dervla', 'Fionnuala', 'Íde', 'Maeve', 'Nuala', 'Órlaith', 'Úna', 'Laoise', 'Aoibhinn', 'Bríd', 'Deirdre', 'Eimear', 'Fíona', 'Mairéad'],
        surname: ["O'Brien", "O'Sullivan", "O'Connor", "O'Neill", "O'Kelly", "Murphy", "Walsh", "Ryan", "Byrne", "McCarthy", "Kelly", "Doyle", "Gallagher", "Clarke", "Kennedy", "Lynch", "Murray", "Quinn", "Moore", "McLoughlin", "Carroll", "Connolly", "Daly", "Connell", "Wilson", "Dunne", "Griffin", "Hayes", "Martin", "McDonnell"]
    },
    WELSH: {
        male: ['Gareth', 'Rhys', 'Owen', 'Dylan', 'Dafydd', 'Llyr', 'Iestyn', 'Geraint', 'Tudur', 'Aneurin', 'Cai', 'Emrys', 'Gwylim', 'Huw', 'Ieuan', 'Jestyn', 'Llewelyn', 'Mabyn', 'Neirin', 'Padrig', 'Rhodri', 'Steffan', 'Tomos', 'Wil', 'Ynyr', 'Brychan', 'Ceredig', 'Dewi', 'Efan', 'Gruffydd'],
        female: ['Angharad', 'Bethan', 'Cerys', 'Dilys', 'Elen', 'Ffion', 'Gwen', 'Heledd', 'Lowri', 'Mair', 'Nerys', 'Olwen', 'Rhiannon', 'Sian', 'Tegan', 'Bronwen', 'Carys', 'Delyth', 'Eira', 'Fflur', 'Gwenllian', 'Heulwen', 'Iona', 'Llinos', 'Megan', 'Non', 'Owena', 'Rhian', 'Sera', 'Tegwen'],
        surname: ['Jones', 'Williams', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Lewis', 'Hughes', 'Morgan', 'Griffiths', 'Edwards', 'Owen', 'Parry', 'Price', 'Jenkins', 'Phillips', 'Lloyd', 'John', 'Rees', 'James', 'Powell', 'Harris', 'Rogers', 'Watkins', 'Davies', 'Morris', 'Ellis', 'Richards', 'Jackson', 'Carter']
    },
    SCOTTISH: {
        male: ['Alasdair', 'Hamish', 'Ruaridh', 'Calum', 'Iain', 'Seumas', 'Torquil', 'Ewan', 'Gregor', 'Magnus', 'Finlay', 'Fraser', 'Duncan', 'Innes', 'Lachlan', 'Murray', 'Niall', 'Rory', 'Struan', 'Tavish', 'Blair', 'Bruce', 'Cameron', 'Douglas', 'Fergus', 'Gordon', 'Grant', 'Keith', 'Kyle', 'Ross'],
        female: ['Fiona', 'Morag', 'Aileas', 'Caoimhe', 'Eilidh', 'Iona', 'Kenna', 'Mairi', 'Shona', 'Tavish', 'Isla', 'Mhairi', 'Catriona', 'Elspeth', 'Fenella', 'Gillian', 'Heather', 'Ishbel', 'Jenna', 'Kirsty', 'Lesley', 'Marsali', 'Nairne', 'Oighrig', 'Peigi', 'Rhona', 'Seonag', 'Teasag', 'Una', 'Vaila'],
        surname: ['MacDonald', 'MacLeod', 'MacKenzie', 'Stewart', 'Campbell', 'MacLean', 'Morrison', 'MacKay', 'MacMillan', 'Fraser', 'Grant', 'MacFarlane', 'MacPherson', 'MacLellan', 'MacGillivray', 'MacInnes', 'MacBride', 'MacRae', 'MacQueen', 'MacBeth', 'Sinclair', 'Gordon', 'Cameron', 'Murray', 'Ross', 'Robertson', 'MacIntosh', 'MacNeil', 'MacArthur', 'MacKinnon']
    },
    DUTCH: {
        male: ['Willem', 'Jan', 'Pieter', 'Hendrik', 'Johannes', 'Cornelis', 'Adriaan', 'Antonius', 'Gerrit', 'Jacobus', 'Martinus', 'Nicolaas', 'Franciscus', 'Petrus', 'Albertus', 'Bernardus', 'Christiaan', 'Dirk', 'Eduard', 'Frederik', 'Gijsbert', 'Herman', 'Izaak', 'Johan', 'Karel', 'Lambertus', 'Michiel', 'Nicolaas', 'Otto', 'Paulus'],
        female: ['Maria', 'Anna', 'Catharina', 'Elisabeth', 'Hendrika', 'Johanna', 'Margaretha', 'Petronella', 'Cornelia', 'Adriana', 'Antonia', 'Bernardina', 'Christina', 'Dorothea', 'Francina', 'Geertruida', 'Helena', 'Jacoba', 'Josina', 'Klasina', 'Leonarda', 'Martina', 'Neeltje', 'Pieternella', 'Susanna', 'Theodora', 'Willemina', 'Alida', 'Betje', 'Dirkje'],
        surname: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer', 'van der Linden', 'Kok', 'Jacobs', 'de Haan', 'Vermeulen']
    },
    SCANDINAVIAN: {
        male: ['Erik', 'Lars', 'Nils', 'Anders', 'Björn', 'Sven', 'Gunnar', 'Olof', 'Magnus', 'Per', 'Johan', 'Carl', 'Mikael', 'Stefan', 'Henrik', 'Mattias', 'Daniel', 'Alexander', 'Fredrik', 'Marcus', 'Oskar', 'Viktor', 'Emil', 'Oliver', 'William', 'Lucas', 'Hugo', 'Theo', 'Leon', 'Noah'],
        female: ['Anna', 'Eva', 'Karin', 'Birgitta', 'Elisabeth', 'Margareta', 'Kristina', 'Ingrid', 'Marie', 'Marianne', 'Lena', 'Emma', 'Astrid', 'Maja', 'Elsa', 'Agnes', 'Freja', 'Saga', 'Wilma', 'Ebba', 'Alicia', 'Vera', 'Klara', 'Molly', 'Meja', 'Lilly', 'Amanda', 'Sigrid', 'Tuva', 'Lovisa'],
        surname: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson', 'Jönsson', 'Lindberg', 'Jakobsson', 'Magnusson', 'Olofsson', 'Lindström', 'Lindqvist', 'Lindgren', 'Berg', 'Axelsson', 'Hedström', 'Mattsson', 'Henriksson', 'Sandberg', 'Forsberg']
    },

    // === ADDITIONAL EUROPEAN GROUPS ===
    BYZANTINE: {
        male: ['Ioannes', 'Konstantinos', 'Mikhael', 'Basilios', 'Theodoros', 'Nikephoros', 'Romanos', 'Alexios', 'Isaakios', 'Ioannikios', 'Stephanos', 'Georgios', 'Athanasios', 'Makarios', 'Prokopios', 'Nikodemos', 'Kallinikos', 'Photios', 'Ignatios', 'Maximos'],
        female: ['Anna', 'Theodora', 'Eirene', 'Zoe', 'Maria', 'Eudokia', 'Euphrosyne', 'Bertha', 'Agnes', 'Konstantina', 'Anastasia', 'Sophia', 'Elisabet', 'Aikaterine', 'Xene', 'Thomais', 'Pulcheria', 'Ariadne', 'Verina', 'Aelia'],
        surname: ['Komnenos', 'Palaiologos', 'Doukas', 'Kantakouzenos', 'Laskaris', 'Angelos', 'Botaneiates', 'Diogenes', 'Phokas', 'Skleros', 'Argyros', 'Maleinos', 'Dalassenos', 'Katakalon', 'Tornikes', 'Bryennios', 'Vatatzas', 'Tzykandyles', 'Raoul', 'Kantakouzenos']
    },
    SLAVIC_MEDIEVAL: {
        male: ['Bogdan', 'Dragomir', 'Milos', 'Stanislav', 'Radoslav', 'Svetoslav', 'Tomislav', 'Dobroslaw', 'Casimir', 'Boleslaw', 'Vladislav', 'Branislav', 'Predrag', 'Nemanja', 'Stefan', 'Dusan', 'Lazar', 'Milutin', 'Rastko', 'Vukan'],
        female: ['Milica', 'Ana', 'Teodora', 'Jelena', 'Katarina', 'Olivera', 'Mara', 'Despina', 'Dragana', 'Branka', 'Jovana', 'Andjelija', 'Vukosava', 'Stana', 'Ruza', 'Danica', 'Smiljana', 'Cveta', 'Nada', 'Vera'],
        surname: ['Nemanjic', 'Brankovic', 'Lazarevic', 'Balšic', 'Crnojevic', 'Kastrioti', 'Dukagjini', 'Thopia', 'Muzaka', 'Arianiti', 'Spani', 'Zaharia', 'Zenevisi', 'Dushmani', 'Blinishti', 'Golemi', 'Matarango', 'Jonima', 'Dusmani', 'Progoni']
    },
    HUNGARIAN: {
        male: ['István', 'László', 'András', 'Géza', 'Kálmán', 'Béla', 'Imre', 'András', 'Endre', 'Salamon', 'Péter', 'Aba', 'Levente', 'Vazul', 'Előd', 'Ond', 'Kond', 'Ors', 'Koppány', 'Gyula'],
        female: ['Gizella', 'Anastasia', 'Adelajda', 'Judith', 'Sophia', 'Euphemia', 'Agnes', 'Anna', 'Margit', 'Erzsébet', 'Konstancia', 'Jolenta', 'Kinga', 'Yolanda', 'Kunigunda', 'Viola', 'Klémencia', 'Katalin', 'Ilona', 'Mária'],
        surname: ['Árpád', 'Hunyadi', 'Szapolyai', 'Báthory', 'Nádasdy', 'Esterházy', 'Rákóczi', 'Zrínyi', 'Frangepán', 'Thurzó', 'Széchenyi', 'Csáky', 'Forgách', 'Pálffy', 'Erdődy', 'Zichy', 'Festetics', 'Károlyi', 'Andrássy', 'Apponyi']
    },
    POLISH: {
        male: ['Bolesław', 'Casimir', 'Władysław', 'Mieszko', 'Leszek', 'Konrad', 'Henryk', 'Przemysł', 'Wacław', 'Ziemowit', 'Janusz', 'Siemowit', 'Trojden', 'Bolesław', 'Kazimierz', 'Sigismund', 'Stefan', 'Jan', 'Stanisław', 'Aleksander'],
        female: ['Jadwiga', 'Elżbieta', 'Anna', 'Katarzyna', 'Zofia', 'Barbara', 'Konstancja', 'Agnieszka', 'Małgorzata', 'Dorota', 'Krystyna', 'Urszula', 'Euphemia', 'Anastazja', 'Beatrycze', 'Cecylia', 'Helena', 'Marianna', 'Teresa', 'Franciszka'],
        surname: ['Jagiełło', 'Piast', 'Vasa', 'Sobieski', 'Poniatowski', 'Czartoryski', 'Potocki', 'Radziwiłł', 'Zamoyski', 'Lubomirski', 'Sapieha', 'Mniszech', 'Ossoliński', 'Tarnowski', 'Kmita', 'Górka', 'Kostka', 'Leszczyński', 'Wiśniowiecki', 'Sanguszko']
    },
    // Modern Central European names (20th century)
    CZECH_MODERN: {
        male: ['Jan', 'Petr', 'Josef', 'Pavel', 'Martin', 'Tomáš', 'Jaroslav', 'František', 'Miroslav', 'Václav', 'Karel', 'Milan', 'Jiří', 'Zdeněk', 'Vladimír', 'Stanislav', 'Michal', 'Lukáš', 'David', 'Ondřej'],
        female: ['Marie', 'Jana', 'Eva', 'Anna', 'Hana', 'Lenka', 'Alena', 'Kateřina', 'Věra', 'Petra', 'Lucie', 'Jaroslava', 'Jitka', 'Helena', 'Ludmila', 'Zdeňka', 'Ivana', 'Monika', 'Tereza', 'Martina'],
        surname: ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pospíšil', 'Marek', 'Pokorný', 'Hájek', 'Král', 'Jelínek', 'Růžička', 'Beneš', 'Fiala', 'Sedláček']
    },
    SLOVAK_MODERN: {
        male: ['Ján', 'Peter', 'Jozef', 'Štefan', 'Milan', 'Tomáš', 'Miroslav', 'Pavol', 'Martin', 'Michal', 'Lukáš', 'Andrej', 'Vladimír', 'Igor', 'Roman', 'Marek', 'Dušan', 'Branislav', 'Radoslav', 'Daniel'],
        female: ['Mária', 'Anna', 'Zuzana', 'Eva', 'Katarína', 'Jana', 'Elena', 'Monika', 'Viera', 'Martina', 'Ivana', 'Lucia', 'Gabriela', 'Alžbeta', 'Lenka', 'Andrea', 'Simona', 'Daniela', 'Barbora', 'Michaela'],
        surname: ['Horváth', 'Kováč', 'Varga', 'Tóth', 'Nagy', 'Baláž', 'Szabó', 'Molnár', 'Novák', 'Kočiš', 'Lukáč', 'Hudák', 'Pavlík', 'Gašpar', 'Marko', 'Jankovič', 'Krajčík', 'Urban', 'Šimko', 'Pavelka']
    },
    POLISH_MODERN: {
        male: ['Jan', 'Stanisław', 'Andrzej', 'Józef', 'Tadeusz', 'Jerzy', 'Zbigniew', 'Krzysztof', 'Henryk', 'Ryszard', 'Kazimierz', 'Marek', 'Marian', 'Piotr', 'Janusz', 'Władysław', 'Adam', 'Wiesław', 'Zdzisław', 'Edward'],
        female: ['Maria', 'Krystyna', 'Anna', 'Barbara', 'Teresa', 'Elżbieta', 'Janina', 'Zofia', 'Jadwiga', 'Danuta', 'Halina', 'Irena', 'Ewa', 'Małgorzata', 'Helena', 'Grażyna', 'Bożena', 'Stanisława', 'Jolanta', 'Urszula'],
        surname: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Wojciechowski', 'Kwiatkowski', 'Krawczyk', 'Kaczmarek', 'Piotrowski', 'Grabowski']
    },
    HUNGARIAN_MODERN: {
        male: ['László', 'István', 'József', 'János', 'Zoltán', 'Sándor', 'Gábor', 'Ferenc', 'Attila', 'Péter', 'Tamás', 'Zsolt', 'Tibor', 'Csaba', 'Imre', 'András', 'Béla', 'Gyula', 'Pál', 'Károly'],
        female: ['Mária', 'Erzsébet', 'Katalin', 'Ilona', 'Éva', 'Anna', 'Zsuzsanna', 'Ágnes', 'Judit', 'Margit', 'Gabriella', 'Andrea', 'Ildikó', 'Mónika', 'Edit', 'Krisztina', 'Erika', 'Anikó', 'Eszter', 'Szilvia'],
        surname: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas', 'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos', 'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete']
    },
    ROMANIAN: {
        male: ['Ion', 'Gheorghe', 'Constantin', 'Vasile', 'Nicolae', 'Dumitru', 'Mihai', 'Alexandru', 'Stefan', 'Andrei', 'Florin', 'Adrian', 'Marian', 'Cristian', 'Daniel', 'Bogdan', 'Ionuț', 'Radu', 'Cosmin', 'Dragoș'],
        female: ['Maria', 'Elena', 'Ana', 'Ioana', 'Nicoleta', 'Adriana', 'Mariana', 'Daniela', 'Cristina', 'Mihaela', 'Carmen', 'Gabriela', 'Alina', 'Monica', 'Simona', 'Laura', 'Andreea', 'Alexandra', 'Roxana', 'Diana'],
        surname: ['Popa', 'Popescu', 'Pop', 'Radu', 'Ionescu', 'Dumitru', 'Stan', 'Stoica', 'Gheorghe', 'Constantin', 'Marin', 'Mihai', 'Ciobanu', 'Rusu', 'Serban', 'Dinu', 'Georgescu', 'Ionita', 'Tudor', 'Dobre']
    },
    YUGOSLAV: {
        male: ['Milan', 'Dragan', 'Zoran', 'Goran', 'Slobodan', 'Predrag', 'Nenad', 'Aleksandar', 'Vladimir', 'Branislav', 'Miloš', 'Marko', 'Stefan', 'Nikola', 'Petar', 'Đorđe', 'Radovan', 'Miroslav', 'Bojan', 'Dejan'],
        female: ['Milica', 'Jelena', 'Ana', 'Marija', 'Dragana', 'Snežana', 'Gordana', 'Ljiljana', 'Vesna', 'Biljana', 'Zorica', 'Slavica', 'Radmila', 'Mirjana', 'Nada', 'Vera', 'Dušanka', 'Milena', 'Svetlana', 'Branka'],
        surname: ['Jovanović', 'Petrović', 'Nikolić', 'Marković', 'Đorđević', 'Stojanović', 'Ilić', 'Stanković', 'Pavlović', 'Milošević', 'Todorović', 'Ristić', 'Radovanović', 'Živković', 'Janković', 'Popović', 'Kostić', 'Mitić', 'Cvetković', 'Lazarević']
    },
    EAST_GERMAN: {
        male: ['Hans', 'Klaus', 'Werner', 'Günter', 'Dieter', 'Horst', 'Jürgen', 'Helmut', 'Gerhard', 'Wolfgang', 'Rolf', 'Bernd', 'Manfred', 'Uwe', 'Peter', 'Frank', 'Thomas', 'Andreas', 'Michael', 'Matthias'],
        female: ['Ingrid', 'Helga', 'Ursula', 'Renate', 'Monika', 'Karin', 'Brigitte', 'Gisela', 'Christa', 'Erika', 'Hannelore', 'Angelika', 'Petra', 'Sabine', 'Gabriele', 'Heike', 'Birgit', 'Martina', 'Katrin', 'Anja'],
        surname: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann']
    },
    BOHEMIAN: {
        male: ['Václav', 'Boleslav', 'Vratislav', 'Břetislav', 'Spytihněv', 'Otakar', 'Karel', 'Jan', 'Václav', 'Sigismund', 'Ladislav', 'Jiří', 'Ferdinand', 'Rudolf', 'Matyáš', 'Ferdinand'],
        female: ['Ludmila', 'Doubravka', 'Božena', 'Gerberga', 'Svatava', 'Adelheid', 'Judita', 'Kunhuta', 'Eliška', 'Anna', 'Alžběta', 'Barbora', 'Johanka', 'Markéta', 'Kateřina', 'Marie'],
        surname: ['Přemyslovec', 'Lucemburský', 'Habsburský', 'Rožmberk', 'Hradec', 'Lobkowicz', 'Pernštejn', 'Smiřický', 'Waldstein', 'Černín', 'Kinský', 'Clam-Gallas', 'Colloredo', 'Thun', 'Martinitz', 'Sternberg', 'Schlick', 'Berka', 'Vrtba', 'Nostitz']
    },
    ARMENIAN: {
        male: ['Aram', 'Armen', 'Ashot', 'Davit', 'Gagik', 'Gevorg', 'Garegin', 'Haig', 'Hovhannes', 'Krikor', 'Levon', 'Manuk', 'Mesrop', 'Nerses', 'Ohan', 'Parsegh', 'Ruben', 'Sarkis', 'Stepan', 'Vahram'],
        female: ['Anahit', 'Armine', 'Astghik', 'Gayane', 'Hripsime', 'Karine', 'Lena', 'Maro', 'Nairi', 'Nvard', 'Olga', 'Ripsime', 'Siran', 'Sona', 'Srpuhi', 'Taline', 'Vartanoush', 'Yeghisapet', 'Zaven', 'Zara'],
        surname: ['Karapetian', 'Hovhannessian', 'Parseghian', 'Aramian', 'Ghazarian', 'Keshishian', 'Manukian', 'Nazarian', 'Papazian', 'Sarkissian', 'Tavitian', 'Vartanian', 'Yacobian', 'Zakarian', 'Balabanian', 'Daoudian', 'Gulbenkian', 'Hagopian', 'Kaloustian', 'Mikaelian']
    },
    GEORGIAN: {
        male: ['Giorgi', 'Levan', 'Irakli', 'Davit', 'Aleksandre', 'Mamuka', 'Zurab', 'Mikheil', 'Vakhtang', 'Guram', 'Konstantine', 'Archil', 'Gocha', 'Gia', 'Beka', 'Lado', 'Nika', 'Tornike', 'Saba', 'Lasha'],
        female: ['Nana', 'Tamar', 'Nino', 'Maia', 'Ketevan', 'Mariam', 'Salome', 'Sopho', 'Eka', 'Ana', 'Nato', 'Rusudan', 'Elene', 'Manana', 'Lika', 'Nutsa', 'Tinatin', 'Darejan', 'Gulnara', 'Nestan'],
        surname: ['Georgievich', 'Dadiani', 'Bagrationi', 'Orbeliani', 'Eristavi', 'Amilakhvari', 'Tsereteli', 'Chavchavadze', 'Andronikashvili', 'Avalishvili', 'Baratashvili', 'Djaparidze', 'Gabashvili', 'Jorjadze', 'Khimshiashvili', 'Machabeli', 'Nakashidze', 'Palavandishvili', 'Sumbatashvili', 'Zubashvili']
    },

    // === EAST ASIAN SUB-GROUPS ===
    JAPANESE: { 
        male: ['Kenji', 'Haru', 'Akira', 'Daichi', 'Hiroshi', 'Takeda', 'Nobu', 'Hideo', 'Ichiro', 'Jiro', 'Kazuo', 'Masato', 'Naoki', 'Osamu', 'Ryuu', 'Satoshi', 'Tadashi', 'Wataru', 'Yasuo', 'Yuuki', 'Mamoru', 'Minoru', 'Shigeru', 'Takumi', 'Hayato', 'Katsuki', 'Ryo', 'Shin', 'Taiga', 'Yuma'],
        female: ['Yuki', 'Hana', 'Sakura', 'Rin', 'Aiko', 'Chiyo', 'Emiko', 'Fumiko', 'Haruka', 'Izumi', 'Junko', 'Kumiko', 'Machiko', 'Noriko', 'Reiko', 'Satomi', 'Tomoko', 'Yuriko', 'Akiko', 'Midori', 'Asuka', 'Ayumi', 'Emi', 'Kaori', 'Miki', 'Nana', 'Risa', 'Sayuri', 'Takako', 'Yoko'],
        surname: ['Tanaka', 'Sato', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Saito', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki', 'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Yamashita', 'Ishikawa', 'Nakajima', 'Maeda', 'Fujita']
    },
    CHINESE_MANDARIN: {
        male: ['Wei', 'Bao', 'An', 'Hao', 'Jian', 'Long', 'Ming', 'Feng', 'Gang', 'Hui', 'Jun', 'Lei', 'Peng', 'Qiang', 'Tao', 'Xin', 'Yang', 'Zhang', 'Bin', 'Chao', 'Dong', 'Fang', 'Guang', 'Hong', 'Jin', 'Kai', 'Li', 'Meng', 'Ning', 'Ping'],
        female: ['Mei', 'Lien', 'Xiao', 'Jia', 'Ling', 'Nuo', 'Ai', 'Hua', 'Juan', 'Li', 'Min', 'Na', 'Ping', 'Qin', 'Rui', 'Shan', 'Ting', 'Wan', 'Xia', 'Yan', 'Yun', 'Zhen', 'Fang', 'Hong', 'Jing', 'Lan', 'Meng', 'Ning', 'Qing', 'Xue'],
        surname: ['Li', 'Wang', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Gao', 'Lin', 'Luo', 'Zheng', 'Liang', 'Xie', 'Song', 'Tang', 'Xu', 'Deng', 'Han', 'Feng', 'Cao']
    },
    CHINESE_CANTONESE: {
        male: ['Wai', 'Ho', 'Fai', 'Wing', 'Chi', 'Man', 'Kin', 'Lok', 'Cheung', 'Kwok', 'Ming', 'Shing', 'Chun', 'Ka', 'Pak', 'Siu', 'Tsz', 'Yiu', 'Ching', 'Hang', 'Hin', 'Hoi', 'Hok', 'Hon', 'Hung', 'Jim', 'Kai', 'Kit', 'Kwan', 'Lam'],
        female: ['Wing', 'Mei', 'Yuk', 'Yan', 'Pui', 'Ling', 'Ka', 'Siu', 'Yee', 'Man', 'Wai', 'Lai', 'Ying', 'Ching', 'Gigi', 'Heidi', 'Joey', 'Karen', 'Maggie', 'Nancy', 'Pauline', 'Queenie', 'Rosanne', 'Shirley', 'Teresa', 'Vivian', 'Wendy', 'Yoyo', 'Zita', 'Ada'],
        surname: ['Chan', 'Leung', 'Wong', 'Li', 'Cheung', 'Lau', 'Ho', 'Mak', 'Ng', 'Ma', 'Lam', 'Fung', 'Chow', 'Yip', 'Tsang', 'Chui', 'Shek', 'Poon', 'Man', 'Lo', 'Yuen', 'Kwan', 'Mok', 'Pang', 'Tang', 'Tse', 'Tsoi', 'Wan', 'Yeung', 'Yiu']
    },
    KOREAN: {
        male: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ha-jun', 'Eun-woo', 'Si-woo', 'Jun-seo', 'Ye-jun', 'Ji-ho', 'In-ho', 'Seung-woo', 'Hyun-woo', 'Jin-woo', 'Tae-hyun', 'Dong-hyun', 'Woo-jin', 'Chan-ho', 'Jae-min', 'Kyung-ho', 'Sang-ho', 'Young-soo', 'Min-ho', 'Joon-ho', 'Sung-min', 'Chang-ho', 'Kwang-soo', 'Hyung-min', 'Dae-hyun', 'Jun-ho', 'Seok-jin'],
        female: ['Ji-hye', 'Seo-yeon', 'Ha-eun', 'Ji-woo', 'Min-seo', 'So-yeon', 'Yoo-jin', 'Chae-won', 'Ga-eun', 'Ye-eun', 'Su-bin', 'Yu-na', 'Hye-jin', 'Eun-ji', 'Da-eun', 'Na-eun', 'Soo-jin', 'Min-ji', 'Ye-jin', 'Hyo-jin', 'Bo-ram', 'Hae-won', 'Ji-min', 'Seo-hyun', 'Yeon-seo', 'Ah-young', 'So-young', 'Hye-won', 'Jin-ah', 'Mi-young'],
        surname: ['Kim', 'Lee', 'Park', 'Choi', 'Jeong', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong', 'Jeon', 'Go', 'Moon', 'Yang', 'Baek', 'Heo', 'Nam', 'Shim', 'Ryu', 'Min']
    },
    VIETNAMESE: {
        male: ['Anh', 'Duc', 'Huy', 'Minh', 'Quang', 'Tuan', 'Vinh', 'Khang', 'Long', 'Nam', 'Phong', 'Son', 'Tai', 'Thinh', 'Trung', 'Vuong', 'Duy', 'Hai', 'Hung', 'Kien', 'Lam', 'Manh', 'Nghia', 'Phuc', 'Quan', 'Sang', 'Thanh', 'Thong', 'Tien', 'Viet'],
        female: ['Anh', 'Linh', 'Mai', 'Nga', 'Quynh', 'Thu', 'Trang', 'Yen', 'Ha', 'Hoa', 'Hong', 'Huong', 'Lan', 'My', 'Nhi', 'Phuong', 'Thao', 'Thuy', 'Tram', 'Trinh', 'Van', 'Xuan', 'Bich', 'Cam', 'Diep', 'Giang', 'Khanh', 'Ly', 'Minh', 'Nu'],
        surname: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly', 'Dinh', 'Dao', 'Trinh', 'Ta', 'Mai', 'Lam', 'Truong', 'Cao', 'Tong', 'Luu', 'Huynh', 'Chu', 'To', 'Quach', 'Tieu']
    },
    THAI: {
        male: ['Adisak', 'Anan', 'Apirat', 'Arthit', 'Chaiya', 'Chatchai', 'Decha', 'Jirasak', 'Kamol', 'Kitti', 'Narong', 'Niran', 'Paiboon', 'Pornchai', 'Prasert', 'Sakchai', 'Samart', 'Somchai', 'Surachai', 'Thana', 'Thawat', 'Vichai', 'Virote', 'Wichai', 'Yuttana', 'Amnuay', 'Bancha', 'Chalerm', 'Danai', 'Ekachai'],
        female: ['Anchalee', 'Apinya', 'Aroonsri', 'Busaba', 'Chanida', 'Duangjai', 'Kanokwan', 'Ladda', 'Malee', 'Namfon', 'Orapan', 'Pensri', 'Ratana', 'Siriwan', 'Suda', 'Sunisa', 'Supatra', 'Suwanna', 'Thipawan', 'Ubon', 'Vimala', 'Waraporn', 'Yupa', 'Chantana', 'Jitra', 'Kulthida', 'Monrudee', 'Nattaya', 'Porntip', 'Rungthip'],
        surname: ['Chaiyaporn', 'Jitpakdee', 'Kamkaew', 'Lertprasert', 'Mahathamrongkul', 'Nakaprasit', 'Pachariyanon', 'Rattanakosin', 'Siriporn', 'Thanakit', 'Udomsak', 'Vichitvongsa', 'Wongprasert', 'Yamyuen', 'Adunyadech', 'Boonsiri', 'Charoenrat', 'Dechapanichkul', 'Eamranond', 'Fuangfoo', 'Gorananant', 'Hansanit', 'Itthipol', 'Jaturonrassamee']
    },
    MONGOLIAN: {
        male: ['Batbayar', 'Batmunkh', 'Battulga', 'Bold', 'Chinbat', 'Dorj', 'Erdene', 'Ganbat', 'Munkhbat', 'Otgonbayar', 'Purevdorj', 'Saikhan', 'Temujin', 'Tuguldur', 'Batkhuu', 'Byambaa', 'Gantulga', 'Khashbat', 'Munkhjargal', 'Naranbaatar', 'Ochirbal', 'Sukhbaatar', 'Tsogtbaatar', 'Ulziibayar', 'Zoljargal', 'Altangerel', 'Batsaikhan', 'Chinzorig', 'Dolgorsuren', 'Enkhbayar'],
        female: ['Altantsetseg', 'Battsetseg', 'Bolormaa', 'Enkhjargal', 'Gereltuya', 'Khaliun', 'Mandukhai', 'Narangerel', 'Oyunaa', 'Purevjav', 'Saikhantuya', 'Tsagaan', 'Ulaankhuu', 'Yesuntei', 'Altantuya', 'Bayarmaa', 'Chinbayar', 'Enkhtsetseg', 'Gansukh', 'Iderkhuu', 'Jargalmaa', 'Khongoroo', 'Munkhjin', 'Otgontsetseg', 'Sukhgerel', 'Tugsuu', 'Uranchimeg', 'Urantuya', 'Zolzaya', 'Ankhbayar'],
        surname: ['Bat', 'Bold', 'Byamba', 'Chinggis', 'Dolgoon', 'Erdene', 'Ganbold', 'Khuu', 'Munkh', 'Otgon', 'Purev', 'Saikhan', 'Temur', 'Tuul', 'Ulaan', 'Zaya', 'Altai', 'Baigal', 'Choijin', 'Doljin', 'Enkhbold', 'Gantulga', 'Javkhlan', 'Munkhjin', 'Naran', 'Oyunbat', 'Sainbayar', 'Tengis', 'Unurbat', 'Zorigbat']
    },

    // === MENA SUB-GROUPS ===
    ARABIC_LEVANT: { 
        male: ['Ahmad', 'Omar', 'Yusuf', 'Ali', 'Mohammed', 'Hassan', 'Khaled', 'Ibrahim', 'Mahmoud', 'Abdallah', 'Marwan', 'Sami', 'Tareq', 'Walid', 'Ziad', 'Amjad', 'Bashar', 'Fadi', 'Ghassan', 'Jihad', 'Karim', 'Nabil', 'Rami', 'Samir', 'Wael', 'Yazan', 'Adel', 'Basel', 'Diyaa', 'Emad'],
        female: ['Fatima', 'Layla', 'Aisha', 'Zainab', 'Mariam', 'Noor', 'Farah', 'Yasmin', 'Hala', 'Rana', 'Reem', 'Sara', 'Dina', 'Jana', 'Lina', 'Maya', 'Rania', 'Salam', 'Widad', 'Yara', 'Abeer', 'Bushra', 'Ghada', 'Hanadi', 'Iman', 'Jumana', 'Khadija', 'Lara', 'Maha', 'Nadia'],
        surname: ['Haddad', 'Nasser', 'Masri', 'Khoury', 'Shami', 'Tahan', 'Khalil', 'Mansour', 'Qasemi', 'Rahhal', 'Sabbagh', 'Tannus', 'Bitar', 'Dahhan', 'Farah', 'Ghannam', 'Hamdan', 'Jarrar', 'Khouri', 'Maalouf', 'Najjar', 'Qaddoura', 'Rizk', 'Saab', 'Tarazi', 'Wakim', 'Yamak', 'Zreik', 'Aboud', 'Diab']
    },
    PERSIAN_FARSI: {
        male: ['Arash', 'Babak', 'Cyrus', 'Darius', 'Kian', 'Rostam', 'Farhad', 'Kaveh', 'Omid', 'Siavash', 'Shahriar', 'Jamshid', 'Kamran', 'Farzad', 'Hooman', 'Saeed', 'Navid', 'Reza', 'Behzad', 'Keyvan', 'Masoud', 'Parviz', 'Shahram', 'Touraj', 'Vahid', 'Bijan', 'Fariborz', 'Hossein', 'Majid', 'Sohrab'],
        female: ['Anahita', 'Esther', 'Yasmin', 'Roxana', 'Soraya', 'Parisa', 'Golnar', 'Shirin', 'Maryam', 'Nasrin', 'Shahrzad', 'Farah', 'Laleh', 'Mahsa', 'Niloufar', 'Pardis', 'Setareh', 'Taraneh', 'Vida', 'Zohreh', 'Bahar', 'Darya', 'Goli', 'Homa', 'Irana', 'Kimia', 'Mitra', 'Nazanin', 'Pegah', 'Samira'],
        surname: ['Rostami', 'Khorasani', 'Yazdi', 'Isfahani', 'Tabrizi', 'Shirazi', 'Mashhadi', 'Tehrani', 'Ahvazi', 'Kermani', 'Rasht', 'Qomi', 'Hamadani', 'Kashani', 'Ardebili', 'Bandar', 'Dezfuli', 'Gorgan', 'Ilami', 'Jahrom', 'Kashan', 'Lorestan', 'Mazandaran', 'Najaf', 'Orumiyeh', 'Parsian', 'Qazvin', 'Rafsanjan', 'Sanandaj', 'Urmia']
    },
    TURKISH: {
        male: ['Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hasan', 'Hüseyin', 'İbrahim', 'İsmail', 'Ömer', 'Osman', 'Süleyman', 'Yusuf', 'Kemal', 'Fatih', 'Emre', 'Burak', 'Murat', 'Serkan', 'Tolga', 'Cem', 'Deniz', 'Erkan', 'Gökhan', 'Hakan', 'Onur', 'Özkan', 'Selim', 'Taner', 'Volkan', 'Yakup'],
        female: ['Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Merve', 'Özge', 'Büşra', 'Gizem', 'Selin', 'Çiğdem', 'Derya', 'Esra', 'Gonca', 'Hülya', 'İrem', 'Kübra', 'Leyla', 'Melike', 'Neslihan', 'Pınar', 'Sevgi', 'Tuba', 'Ülkü', 'Yasemin', 'Asiye', 'Burcu', 'Dilek', 'Filiz'],
        surname: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydin', 'Özdemir', 'Arslan', 'Doğan', 'Kilic', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Erdoğan', 'Güneş', 'Aksu', 'Bayram', 'Çakır', 'Duman', 'Erdem', 'Güler', 'Kılıç', 'Polat']
    },
    HEBREW: {
        male: ['David', 'Daniel', 'Michael', 'Yosef', 'Moshe', 'Benjamin', 'Avraham', 'Yitzhak', 'Yaakov', 'Shlomo', 'Shimon', 'Reuven', 'Gad', 'Asher', 'Naftali', 'Efraim', 'Menashe', 'Yehuda', 'Levi', 'Aharon', 'Noam', 'Eitan', 'Amit', 'Roi', 'Ido', 'Tal', 'Omer', 'Yuval', 'Gal', 'Ariel'],
        female: ['Sarah', 'Rivka', 'Rachel', 'Leah', 'Miriam', 'Esther', 'Ruth', 'Naomi', 'Tamar', 'Abigail', 'Hannah', 'Deborah', 'Judith', 'Batsheva', 'Michal', 'Dinah', 'Shira', 'Noa', 'Maya', 'Tal', 'Chen', 'Yael', 'Orli', 'Liron', 'Gal', 'Shachar', 'Roni', 'Keren', 'Dafna', 'Hila'],
        surname: ['Cohen', 'Levi', 'Miller', 'Goldstein', 'Rosen', 'Friedman', 'Katz', 'Schwartz', 'Klein', 'Green', 'Stern', 'Wolf', 'Weiss', 'Rosenberg', 'Goldberg', 'Shapiro', 'Kaplan', 'Berman', 'Silver', 'Reich', 'Gross', 'Adler', 'Hirsch', 'Blau', 'Stein', 'Frank', 'Geller', 'Horowitz', 'Kaufman', 'Levin']
    },
    BERBER_AMAZIGH: {
        male: ['Amellal', 'Azru', 'Ifri', 'Lmahdi', 'Massinissa', 'Yuba', 'Azalay', 'Itri', 'Tamazight', 'Akli', 'Amyas', 'Azwaw', 'Dihya', 'Gaya', 'Matoub', 'Meziane', 'Mohand', 'Ouali', 'Slimane', 'Youcef', 'Amayas', 'Ameziane', 'Aqvayli', 'Aurassi', 'Azayku', 'Azegzaw', 'Azelmad', 'Azelmat', 'Azemour', 'Azeryul'],
        female: ['Dihya', 'Tafukt', 'Tilelli', 'Yemma', 'Tislit', 'Taqbaylit', 'Thilleli', 'Wardia', 'Yelli', 'Zahra', 'Tasa', 'Tamurt', 'Tafrawt', 'Takfarinas', 'Tamazight', 'Taneqqust', 'Targia', 'Tasekkurt', 'Tawenza', 'Taziri', 'Thiziri', 'Tifawt', 'Tilla', 'Tilleli', 'Tinhinan', 'Tiska', 'Tiziri', 'Ulac', 'Warda', 'Yemma'],
        surname: ['Amellal', 'Azayku', 'Azegzaw', 'Azelmad', 'Azelmat', 'Azemour', 'Azeryul', 'Azru', 'Ifri', 'Itri', 'Tamazight', 'Tilelli', 'Wardia', 'Zahra', 'Amyas', 'Azwaw', 'Gaya', 'Matoub', 'Meziane', 'Mohand', 'Ouali', 'Slimane', 'Youcef', 'Amayas', 'Ameziane', 'Aqvayli', 'Aurassi', 'Dihya', 'Tafukt', 'Yemma']
    },

    // === SOUTH ASIAN SUB-GROUPS ===
    HINDI: {
        male: ['Arjun', 'Rohan', 'Vikram', 'Ananda', 'Siddhartha', 'Rajesh', 'Suresh', 'Mahesh', 'Ramesh', 'Dinesh', 'Mukesh', 'Rakesh', 'Naresh', 'Hitesh', 'Ganesh', 'Yogesh', 'Umesh', 'Jitesh', 'Kamlesh', 'Lokesh', 'Ravi', 'Anil', 'Sunil', 'Manoj', 'Vinod', 'Pramod', 'Ajay', 'Vijay', 'Sanjay', 'Amitabh'],
        female: ['Priya', 'Anjali', 'Aisha', 'Lakshmi', 'Sita', 'Radha', 'Gita', 'Rita', 'Nita', 'Anita', 'Sunita', 'Mamta', 'Shanti', 'Bharti', 'Shakti', 'Kriti', 'Preeti', 'Neeti', 'Jyoti', 'Aarti', 'Sushma', 'Rekha', 'Meera', 'Geeta', 'Seeta', 'Veena', 'Leela', 'Sheela', 'Heera', 'Kiran'],
        surname: ['Kumar', 'Singh', 'Patel', 'Gupta', 'Sharma', 'Verma', 'Agarwal', 'Tiwari', 'Mishra', 'Shukla', 'Pandey', 'Chandra', 'Joshi', 'Yadav', 'Thakur', 'Sinha', 'Jain', 'Bansal', 'Goel', 'Agrawal', 'Saxena', 'Rastogi', 'Srivastava', 'Tripathi', 'Dwivedi', 'Chaturvedi', 'Bajpai', 'Pathak', 'Awasthi', 'Upadhyay']
    },
    BENGALI: {
        male: ['Abhijit', 'Amitabha', 'Aniruddha', 'Bijoy', 'Debabrata', 'Goutam', 'Hiranmay', 'Jayanta', 'Kanchan', 'Mrinal', 'Nirmal', 'Partha', 'Ranjan', 'Sandip', 'Tapan', 'Uttam', 'Biswajit', 'Chandan', 'Dipankar', 'Gauranga', 'Haripada', 'Jagadish', 'Kalyan', 'Manish', 'Nitish', 'Pranab', 'Rajib', 'Subhash', 'Tarun', 'Vivek'],
        female: ['Anindita', 'Baishakhi', 'Chandrima', 'Debarati', 'Gargi', 'Indira', 'Jayanti', 'Keya', 'Labanya', 'Madhurima', 'Nandita', 'Paroma', 'Radhika', 'Sharmila', 'Tanuja', 'Urmila', 'Bijoya', 'Chaitali', 'Dola', 'Gita', 'Himani', 'Jaya', 'Kakali', 'Malabika', 'Namita', 'Pallavi', 'Ratna', 'Sumitra', 'Tapati', 'Vandana'],
        surname: ['Banerjee', 'Chatterjee', 'Mukherjee', 'Bhattacharya', 'Chakraborty', 'Ghosh', 'Bose', 'Sen', 'Dutta', 'Roy', 'Sarkar', 'Das', 'Pal', 'Saha', 'Majumdar', 'Mitra', 'Biswas', 'Ganguly', 'Chowdhury', 'Mandal', 'Sinha', 'Kar', 'Nandi', 'Basu', 'Samanta', 'Halder', 'Naskar', 'Maiti', 'Jana', 'Adhikari']
    },
    TAMIL: {
        male: ['Anand', 'Balachandra', 'Chandrasekhar', 'Dhananjay', 'Ganesan', 'Hariharan', 'Jagannath', 'Karthik', 'Mahendra', 'Narayanan', 'Prakash', 'Raghavan', 'Sankaran', 'Thyagarajan', 'Venkatesh', 'Arjun', 'Balaji', 'Dinesh', 'Ganesh', 'Krishna', 'Murugan', 'Raman', 'Selvan', 'Suresh', 'Vimal', 'Arun', 'Deepak', 'Gopal', 'Hari', 'Mohan'],
        female: ['Aadhya', 'Bhuvana', 'Chitra', 'Divya', 'Geetha', 'Hema', 'Janani', 'Kamala', 'Lalitha', 'Meera', 'Nithya', 'Padma', 'Radha', 'Shanti', 'Thulasi', 'Uma', 'Vasuki', 'Yamuna', 'Anjali', 'Bharathi', 'Deepika', 'Gayathri', 'Indira', 'Kavitha', 'Malini', 'Nandini', 'Priya', 'Revathi', 'Suganya', 'Vani'],
        surname: ['Iyer', 'Iyengar', 'Pillai', 'Nair', 'Reddy', 'Mudaliar', 'Chettiar', 'Gounder', 'Nadar', 'Thevar', 'Raman', 'Krishnan', 'Subramanian', 'Venkataraman', 'Sundaram', 'Ayyar', 'Bhatt', 'Menon', 'Panicker', 'Warrier', 'Namboothiri', 'Nambiar', 'Unnithan', 'Kaimal', 'Thampi', 'Varma', 'Raja', 'Maharaja', 'Dewan', 'Patel']
    },
    PUNJABI: {
        male: ['Amarjit', 'Baljit', 'Charanjit', 'Davinder', 'Gurbachan', 'Hardeep', 'Jasbir', 'Kulbir', 'Maninder', 'Navjot', 'Paramjit', 'Ranjit', 'Simranjit', 'Tarlochan', 'Varinder', 'Amrik', 'Balwinder', 'Daljit', 'Gurmeet', 'Jaspal', 'Kuldeep', 'Makhan', 'Nirmal', 'Parminder', 'Satpal', 'Tejinder', 'Avtar', 'Bikram', 'Daler', 'Gagan'],
        female: ['Amarjeet', 'Baljeet', 'Charanjeet', 'Daljeet', 'Gurjeet', 'Harjeet', 'Jasjeet', 'Kulwant', 'Manjeet', 'Navjeet', 'Paramjeet', 'Ranjeet', 'Simranjeet', 'Tarnjeet', 'Varjeet', 'Amrit', 'Balwant', 'Davinder', 'Gurmeet', 'Jasleen', 'Kulpreet', 'Manpreet', 'Nirmal', 'Parmjeet', 'Satinder', 'Tejinder', 'Avneet', 'Bikramjit', 'Daman', 'Gaganjit'],
        surname: ['Singh', 'Kaur', 'Gill', 'Sandhu', 'Brar', 'Sidhu', 'Dhillon', 'Grewal', 'Bajwa', 'Virk', 'Mann', 'Randhawa', 'Cheema', 'Saini', 'Kang', 'Bath', 'Chahal', 'Deol', 'Ghuman', 'Johal', 'Kahlon', 'Lally', 'Minhas', 'Nagra', 'Panesar', 'Rahi', 'Sahota', 'Takhar', 'Uppal', 'Walia']
    },

    // === SUB-SAHARAN AFRICAN SUB-GROUPS ===
    YORUBA: {
        male: ['Adebayo', 'Babatunde', 'Chukwuemeka', 'Damilola', 'Emeka', 'Folarin', 'Gbenga', 'Hakeem', 'Idris', 'Jide', 'Kemi', 'Lanre', 'Muyiwa', 'Niyi', 'Olu', 'Pelumi', 'Rotimi', 'Segun', 'Tunde', 'Uche', 'Wale', 'Yemi', 'Adamu', 'Bolaji', 'Chidi', 'Dayo', 'Femi', 'Goke', 'Kayode', 'Lekan'],
        female: ['Adunni', 'Bisi', 'Chioma', 'Dupe', 'Ebun', 'Funmi', 'Gbemi', 'Hadiza', 'Ife', 'Joke', 'Kemi', 'Lola', 'Moji', 'Nike', 'Ope', 'Peju', 'Ronke', 'Sade', 'Titi', 'Uche', 'Wunmi', 'Yemi', 'Abisola', 'Bukola', 'Chiamaka', 'Damilola', 'Folake', 'Gbemisola', 'Kehinde', 'Modupe'],
        surname: ['Adebayo', 'Babatunde', 'Ogundimu', 'Oluwaseun', 'Adeyemi', 'Ogundipe', 'Adesanya', 'Oyebanji', 'Oladapo', 'Adebisi', 'Oguntade', 'Akinwale', 'Ogunbayo', 'Adebola', 'Oyewole', 'Adesola', 'Ogundare', 'Akinola', 'Ogunleye', 'Adewale', 'Oyekanmi', 'Adekunle', 'Ogundiran', 'Akinyemi', 'Ogunmola', 'Adeniyi', 'Oyedele', 'Adesina', 'Oguntoye', 'Akintola']
    },
    SWAHILI: {
        male: ['Abdi', 'Bakari', 'Chuma', 'Dalila', 'Faraji', 'Hakeem', 'Jabari', 'Kesi', 'Maulidi', 'Omari', 'Rashidi', 'Salim', 'Tariq', 'Uthman', 'Wasaki', 'Yusuf', 'Azizi', 'Babu', 'Daudi', 'Fadhili', 'Haruni', 'Jengo', 'Kito', 'Mwangi', 'Pemba', 'Saidi', 'Tumbo', 'Vuai', 'Waziri', 'Zuberi'],
        female: ['Aisha', 'Bahati', 'Chiku', 'Dalila', 'Eshe', 'Furaha', 'Hadiya', 'Imara', 'Jengo', 'Kamaria', 'Layla', 'Malkia', 'Nia', 'Penda', 'Raziya', 'Safiya', 'Tatu', 'Uzuri', 'Wema', 'Zaina', 'Amara', 'Busara', 'Dada', 'Fadhila', 'Hawa', 'Jalia', 'Kesi', 'Mwajuma', 'Neema', 'Subira'],
        surname: ['Mwangi', 'Kariuki', 'Wanjiku', 'Kamau', 'Njoroge', 'Wanjiru', 'Mutua', 'Kiprotich', 'Chepkemoi', 'Rotich', 'Kiplagat', 'Jeptoo', 'Kiptoo', 'Chepkoech', 'Kibet', 'Cheruiyot', 'Sang', 'Ruto', 'Koech', 'Lagat', 'Kemboi', 'Tanui', 'Korir', 'Kirui', 'Biwott', 'Cherono', 'Keter', 'Langat', 'Kipchoge', 'Chepngetich']
    },
    AMHARIC: {
        male: ['Abebe', 'Bekele', 'Dawit', 'Girma', 'Haile', 'Kebede', 'Meles', 'Negussie', 'Solomon', 'Teshome', 'Worku', 'Yohannes', 'Addisu', 'Berhanu', 'Desta', 'Getachew', 'Kassahun', 'Lemma', 'Mulugeta', 'Tadesse', 'Aklilu', 'Biniam', 'Daniel', 'Eskinder', 'Fisseha', 'Gebru', 'Henok', 'Tekle', 'Wondwossen', 'Yared'],
        female: ['Almaz', 'Bethlehem', 'Desta', 'Genet', 'Hanna', 'Kidist', 'Meron', 'Netsanet', 'Selamawit', 'Tigist', 'Workitu', 'Yeshimebet', 'Azeb', 'Birtukan', 'Elsa', 'Firehiwot', 'Hiwot', 'Kalkidan', 'Mahlet', 'Ruth', 'Samrawit', 'Tsige', 'Abeba', 'Belaynesh', 'Eden', 'Gelila', 'Helen', 'Liya', 'Mulu', 'Rekik'],
        surname: ['Tadesse', 'Kebede', 'Bekele', 'Tesfaye', 'Desta', 'Girma', 'Haile', 'Worku', 'Negash', 'Abebe', 'Getachew', 'Mulugeta', 'Berhanu', 'Tekle', 'Lemma', 'Kassahun', 'Meles', 'Teshome', 'Yohannes', 'Addisu', 'Aklilu', 'Biniam', 'Daniel', 'Eskinder', 'Fisseha', 'Gebru', 'Henok', 'Wondwossen', 'Yared', 'Almaz']
    },
    ZULU: {
        male: ['Andile', 'Bongani', 'Cedric', 'Dumisani', 'Fikile', 'Gcina', 'Hlengiwe', 'Jabu', 'Khulani', 'Lungelo', 'Mandla', 'Nkosana', 'Phumelelo', 'Sbu', 'Themba', 'Vusi', 'Wiseman', 'Xolani', 'Yenzokuhle', 'Zinhle', 'Ayanda', 'Buhle', 'Clement', 'Daluxolo', 'Fanele', 'Gugu', 'Happy', 'Lwazi', 'Menzi', 'Nhlanhla'],
        female: ['Anele', 'Busisiwe', 'Cebile', 'Duduzile', 'Fikile', 'Gcina', 'Hlengiwe', 'Jabulile', 'Khanyisile', 'Lindiwe', 'Mbali', 'Nokuthula', 'Precious', 'Sandile', 'Thabile', 'Unathi', 'Vuyelwa', 'Winnie', 'Xolisile', 'Yolanda', 'Zandile', 'Ayanda', 'Buhle', 'Cynthia', 'Dimakatso', 'Faith', 'Gugu', 'Happiness', 'Lerato', 'Nomsa'],
        surname: ['Zulu', 'Dlamini', 'Nkomo', 'Mthembu', 'Khumalo', 'Ndlovu', 'Mahlangu', 'Sibiya', 'Mnguni', 'Zwane', 'Shange', 'Vilakazi', 'Makhanya', 'Nxumalo', 'Ngcobo', 'Cele', 'Madlala', 'Mhlongo', 'Ntuli', 'Khoza', 'Gumede', 'Mbeki', 'Radebe', 'Sithole', 'Maseko', 'Shabalala', 'Mazibuko', 'Maphumulo', 'Buthelezi', 'Mseleku']
    },

    // === OCEANIA SUB-GROUPS ===
    POLYNESIAN: {
        male: ['Manaia', 'Hemi', 'Tane', 'Rangi', 'Kai', 'Aroha', 'Wiremu', 'Te Koha', 'Mahina', 'Teiva', 'Koa', 'Keoni', 'Nalani', 'Kawika', 'Ikaika', 'Akamu', 'Keanu', 'Makoa', 'Anaru', 'Rawiri', 'Tamati', 'Hoani', 'Pita', 'Rewi', 'Tawhiri', 'Rongo', 'Tama', 'Koru', 'Whai', 'Turi'],
        female: ['Moana', 'Hina', 'Leilani', 'Malia', 'Aroha', 'Kiri', 'Anahera', 'Mere', 'Ngaire', 'Roimata', 'Ataahua', 'Marama', 'Kaia', 'Lani', 'Nalani', 'Mahina', 'Naia', 'Lehua', 'Pua', 'Kalani', 'Noelani', 'Kalea', 'Mele', 'Pikake', 'Tiaré', 'Tiare', 'Raina', 'Moea', 'Haumea', 'Nayeli'],
        surname: ['(No Surname)', 'Taua', 'Ariki', 'Rangatira', 'Tohunga', 'Kaumatua', 'Tangata', 'Wahine', 'Tamariki', 'Whakapapa', 'Iwi', 'Hapu', 'Marae', 'Hangi', 'Poi', 'Haka', 'Hongi', 'Karakia', 'Mihi', 'Powhiri', 'Whakatohea', 'Ngati', 'Te Ati', 'Ngai', 'Kai', 'Mana', 'Tapu', 'Noa', 'Moko', 'Tikanga']
    },
    MELANESIAN: {
        male: ['Bani', 'Tavu', 'Kem', 'Wani', 'Nalu', 'Kila', 'Mendi', 'Vanua', 'Tiko', 'Ratu', 'Seru', 'Jone', 'Viliame', 'Epeli', 'Tomasi', 'Aisea', 'Manoa', 'Tevita', 'Salote', 'Rusiate', 'Simione', 'Peni', 'Waisea', 'Iowane', 'Mosese', 'Lasaro', 'Filipe', 'Petero', 'Apisai', 'Isikeli'],
        female: ['Salote', 'Ana', 'Mere', 'Mele', 'Litia', 'Vika', 'Sala', 'Adi', 'Bulou', 'Lavenia', 'Serena', 'Talei', 'Nanise', 'Alanieta', 'Makereta', 'Veniana', 'Arieta', 'Kelera', 'Melaia', 'Raijeli', 'Timoci', 'Vasiti', 'Akanisi', 'Salanieta', 'Laisani', 'Taraivini', 'Vulimila', 'Wainikiti', 'Salome', 'Eta'],
        surname: ['Tamani', 'Vakatawa', 'Vuki', 'Nailatikau', 'Bainimarama', 'Ratunabuabua', 'Vunibobo', 'Caucau', 'Radradra', 'Matavesi', 'Volavola', 'Kolinisau', 'Vugakoto', 'Nacuqu', 'Nayacalevu', 'Tuitoga', 'Waqaseduadua', 'Goneva', 'Nakawara', 'Talebula', 'Navua', 'Koroi', 'Ravulo', 'Wainiqolo', 'Veikoso', 'Botitu', 'Ratuabu', 'Kubunavanua', 'Seruiratu', 'Tuberi']
    },
    ABORIGINAL_AUSTRALIAN: {
        male: ['Birrani', 'Darel', 'Jarrah', 'Koori', 'Mandawuy', 'Nullah', 'Tjandrawati', 'Warwick', 'Yurrampi', 'Kirra', 'Bindi', 'Boori', 'Budgeree', 'Cooinda', 'Daku', 'Gidgee', 'Jannali', 'Kiah', 'Lachlan', 'Miro', 'Namatjira', 'Oodgeroo', 'Poolamacca', 'Quandong', 'Tarkine', 'Uluru', 'Wagga', 'Yamba', 'Yarrawarra', 'Bidjigal'],
        female: ['Allira', 'Brindabella', 'Colebee', 'Doolhof', 'Elanora', 'Gindarra', 'Jannali', 'Kirra', 'Lowanna', 'Marlee', 'Naia', 'Pemulwuy', 'Queanbeyan', 'Tallara', 'Ulladulla', 'Wagga', 'Yamba', 'Alinta', 'Bindi', 'Coolah', 'Djarragun', 'Eliza', 'Goorialla', 'Jundah', 'Kalgoorlie', 'Merinda', 'Narrandera', 'Papunya', 'Tiwi', 'Warrnambool'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // === SOUTH AMERICAN SUB-GROUPS ===
    ANDEAN_QUECHUA: {
        male: ['Apu', 'Atawallpa', 'Inti', 'Pachakutiq', 'Tupaq', 'Wayna', 'Qhapaq', 'Inka', 'Manco', 'Sayri', 'Thupa', 'Wiraqocha', 'Amaru', 'Challwa', 'Huascar', 'Illapa', 'Kuntur', 'Puma', 'Rumi', 'Sumaq', 'Tayta', 'Ukuku', 'Vicuña', 'Waman', 'Yakana', 'Zara', 'Chaska', 'Huanca', 'Kimsa', 'Lloque'],
        female: ['Coya', 'Killa', 'Mama', 'Ñusta', 'Quispe', 'Sisa', 'Sumaq', 'Tika', 'Urpi', 'Wayna', 'Yaku', 'Chaska', 'Chuya', 'Illa', 'Inti', 'Kusi', 'Phuyupatamanta', 'Qori', 'Raymi', 'Sarita', 'Tanta', 'Umiña', 'Warmi', 'Yana', 'Achik', 'Chakana', 'Hanan', 'Khuya', 'Munay', 'Phaway'],
        surname: ['Yupanki', 'Wankár', 'Quespi', 'Kondori', 'Waman', 'Amaru', 'Choque', 'Quispe', 'Huanca', 'Mamani', 'Flores', 'Apaza', 'Ccopa', 'Cusipaucar', 'Hancco', 'Inca', 'Llanos', 'Marca', 'Nina', 'Pacco', 'Quiso', 'Ramos', 'Soncco', 'Ttito', 'Vargas', 'Waskar', 'Xerez', 'Yabar', 'Zapana', 'Alanoca']
    },
    GUARANI: {
        male: ['Arandu', 'Carai', 'Guyrá', 'Jagua', 'Karai', 'Mandu', 'Nande', 'Paraguasu', 'Ruvicha', 'Sepé', 'Tabare', 'Ubiratan', 'Yaci', 'Aimberê', 'Caetano', 'Guaraci', 'Ibiapina', 'Jaci', 'Karim', 'Moacir', 'Peri', 'Rudá', 'Tupã', 'Ubirajara', 'Abeguar', 'Boitatá', 'Cunhambebe', 'Guaraní', 'Iara', 'Jandira'],
        female: ['Iara', 'Jaci', 'Jurema', 'Maiara', 'Potira', 'Raoni', 'Tainá', 'Uiara', 'Yara', 'Aracy', 'Ceci', 'Iracema', 'Janaína', 'Moema', 'Naiá', 'Potyra', 'Rudá', 'Tainá', 'Ubiratã', 'Yacy', 'Açucena', 'Cauã', 'Guaraci', 'Iansan', 'Jandaira', 'Kauê', 'Maíra', 'Naara', 'Piraí', 'Samaúma'],
        surname: ['Caballero', 'González', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vargas', 'Castillo', 'Jiménez', 'Ruiz', 'Díaz', 'Moreno', 'Herrera', 'Medina', 'Aguilar', 'Gutiérrez', 'Contreras', 'Mendoza', 'Ortega', 'Silva', 'Romero', 'Guerrero', 'Vega', 'Noguera']
    },

    // Default fallbacks (broad)
    EUROPEAN: {
        male: ['John', 'William', 'Thomas', 'Robert', 'James', 'Richard', 'Edward', 'Henry', 'Walter', 'Roger', 'Bartholomew', 'Geoffrey', 'Edmund', 'Stephen', 'Nicholas', 'Christopher', 'Alexander', 'Michael', 'Anthony', 'Peter', 'Charles', 'Francis', 'Arthur', 'Frederick', 'George', 'Harold', 'Ralph', 'Philip', 'Mark', 'Matthew'],
        female: ['Mary', 'Eliza', 'Anne', 'Eleanor', 'Margaret', 'Alice', 'Joan', 'Isabella', 'Matilda', 'Catherine', 'Beatrice', 'Agnes', 'Elizabeth', 'Jane', 'Sarah', 'Emma', 'Grace', 'Rose', 'Helen', 'Victoria', 'Florence', 'Charlotte', 'Sophia', 'Diana', 'Rebecca', 'Rachel', 'Judith', 'Caroline', 'Frances', 'Arabella'],
        surname: ['Smith', 'Baker', 'Cook', 'Taylor', 'Miller', 'Hill', 'Green', 'Carter', 'Wright', 'Mason', 'Cooper', 'Fletcher', 'Turner', 'Parker', 'Brown', 'Davis', 'Wilson', 'Moore', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall']
    },
    EAST_ASIAN: { 
        male: ['Kenji', 'Haru', 'Wei', 'Bao', 'Min-jun', 'Akira', 'Long', 'Seo-jun', 'Hiroshi', 'Gang', 'Do-yun', 'Takeda', 'Ming', 'Ha-jun', 'Nobu', 'Feng', 'Eun-woo', 'Hideo', 'Hui', 'Si-woo', 'Ichiro', 'Jun', 'Jun-seo', 'Jiro', 'Lei', 'Ye-jun', 'Kazuo', 'Peng', 'Ji-ho', 'Masato'],
        female: ['Yuki', 'Hana', 'Mei', 'Lien', 'Ji-hye', 'Sakura', 'Xiao', 'Seo-yeon', 'Rin', 'Jia', 'Ha-eun', 'Aiko', 'Ling', 'Ji-woo', 'Chiyo', 'Nuo', 'Min-seo', 'Emiko', 'Ai', 'So-yeon', 'Fumiko', 'Hua', 'Yoo-jin', 'Haruka', 'Juan', 'Chae-won', 'Izumi', 'Li', 'Ga-eun', 'Junko'],
        surname: ['Tanaka', 'Sato', 'Li', 'Wang', 'Kim', 'Lee', 'Suzuki', 'Zhang', 'Park', 'Takahashi', 'Liu', 'Choi', 'Watanabe', 'Chen', 'Jeong', 'Ito', 'Yang', 'Kang', 'Yamamoto', 'Huang', 'Cho', 'Nakamura', 'Zhao', 'Yoon', 'Kobayashi', 'Wu', 'Jang', 'Saito', 'Zhou', 'Lim']
    },
    MENA: { 
        male: ['Ahmad', 'Omar', 'Yusuf', 'Arash', 'Kian', 'Ali', 'Babak', 'Mohammed', 'Cyrus', 'Hassan', 'Darius', 'Khaled', 'Farhad', 'Ibrahim', 'Kaveh', 'Mahmoud', 'Omid', 'Abdallah', 'Siavash', 'Marwan', 'Shahriar', 'Sami', 'Jamshid', 'Tareq', 'Kamran', 'Walid', 'Farzad', 'Ziad', 'Hooman', 'Amjad'],
        female: ['Fatima', 'Layla', 'Aisha', 'Yasmin', 'Soraya', 'Zainab', 'Anahita', 'Mariam', 'Esther', 'Noor', 'Roxana', 'Farah', 'Parisa', 'Hala', 'Golnar', 'Rana', 'Shirin', 'Reem', 'Maryam', 'Sara', 'Nasrin', 'Dina', 'Shahrzad', 'Jana', 'Farah', 'Lina', 'Laleh', 'Maya', 'Mahsa', 'Rania'],
        surname: ['Haddad', 'Nasser', 'Rostami', 'Yazdi', 'Masri', 'Khorasani', 'Khoury', 'Isfahani', 'Shami', 'Tabrizi', 'Tahan', 'Shirazi', 'Khalil', 'Mashhadi', 'Mansour', 'Tehrani', 'Qasemi', 'Ahvazi', 'Rahhal', 'Kermani', 'Sabbagh', 'Rasht', 'Tannus', 'Qomi', 'Bitar', 'Hamadani', 'Dahhan', 'Kashani', 'Farah', 'Ardebili']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        male: ['Nanabozho', 'Wabigwan', 'Makoons', 'Migizi', 'Giizhig', 'Binesi', 'Makak', 'Waabigwanii', 'Ogichidaa', 'Gichi', 'Migwech', 'Anishinaabe', 'Boozhoo', 'Giwedin', 'Ishkode', 'Manidoo', 'Miigwech', 'Nooko', 'Ozhaawashko', 'Waaboos', 'Chayton', 'Ezhno', 'Hakan', 'Kuruk', 'Nantan', 'Pachu', 'Sani', 'Takoda', 'Wapi', 'Aiukli'],
        female: ['Nokomis', 'Waabigwanii', 'Ogichidaakwe', 'Migizi', 'Giizhigokwe', 'Binesi', 'Makoons', 'Waabigwan', 'Anishinaabekwe', 'Gichigami', 'Ishkodekwe', 'Manidookwe', 'Miigwech', 'Nookookwe', 'Ozhaawashko', 'Waaboos', 'Giiwedin', 'Migwech', 'Boozhoo', 'Wabana', 'Aiyana', 'Chenoa', 'Dyani', 'Halona', 'Imala', 'Kachina', 'Leotie', 'Nayeli', 'Orenda', 'Papina'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    OCEANIA: {
        male: ['Manaia', 'Hemi', 'Tane', 'Rangi', 'Kai', 'Aroha', 'Wiremu', 'Te Koha', 'Mahina', 'Teiva', 'Koa', 'Keoni', 'Nalani', 'Kawika', 'Ikaika', 'Akamu', 'Keanu', 'Makoa', 'Anaru', 'Rawiri', 'Tamati', 'Hoani', 'Pita', 'Rewi', 'Tawhiri', 'Rongo', 'Tama', 'Koru', 'Whai', 'Turi'],
        female: ['Moana', 'Hina', 'Leilani', 'Malia', 'Aroha', 'Kiri', 'Anahera', 'Mere', 'Ngaire', 'Roimata', 'Ataahua', 'Marama', 'Kaia', 'Lani', 'Nalani', 'Mahina', 'Naia', 'Lehua', 'Pua', 'Kalani', 'Noelani', 'Kalea', 'Mele', 'Pikake', 'Tiaré', 'Tiare', 'Raina', 'Moea', 'Haumea', 'Nayeli'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    SOUTH_ASIAN: {
        male: ['Arjun', 'Rohan', 'Vikram', 'Ananda', 'Siddhartha', 'Rajesh', 'Suresh', 'Mahesh', 'Ramesh', 'Dinesh', 'Mukesh', 'Rakesh', 'Naresh', 'Hitesh', 'Ganesh', 'Yogesh', 'Umesh', 'Jitesh', 'Kamlesh', 'Lokesh', 'Ravi', 'Anil', 'Sunil', 'Manoj', 'Vinod', 'Pramod', 'Ajay', 'Vijay', 'Sanjay', 'Amitabh'],
        female: ['Priya', 'Anjali', 'Aisha', 'Lakshmi', 'Sita', 'Radha', 'Gita', 'Rita', 'Nita', 'Anita', 'Sunita', 'Mamta', 'Shanti', 'Bharti', 'Shakti', 'Kriti', 'Preeti', 'Neeti', 'Jyoti', 'Aarti', 'Sushma', 'Rekha', 'Meera', 'Geeta', 'Seeta', 'Veena', 'Leela', 'Sheela', 'Heera', 'Kiran'],
        surname: ['Kumar', 'Singh', 'Patel', 'Gupta', 'Khan', 'Sharma', 'Verma', 'Agarwal', 'Tiwari', 'Mishra', 'Shukla', 'Pandey', 'Chandra', 'Joshi', 'Yadav', 'Thakur', 'Sinha', 'Jain', 'Bansal', 'Goel', 'Agrawal', 'Saxena', 'Rastogi', 'Srivastava', 'Tripathi', 'Dwivedi', 'Chaturvedi', 'Bajpai', 'Pathak', 'Awasthi']
    },
    SOUTH_AMERICAN: {
        male: ['Apu', 'Atawallpa', 'Inti', 'Pachakutiq', 'Tupaq', 'Wayna', 'Qhapaq', 'Inka', 'Manco', 'Sayri', 'Thupa', 'Wiraqocha', 'Amaru', 'Challwa', 'Huascar', 'Illapa', 'Kuntur', 'Puma', 'Rumi', 'Sumaq', 'Tayta', 'Ukuku', 'Vicuña', 'Waman', 'Yakana', 'Zara', 'Chaska', 'Huanca', 'Kimsa', 'Lloque'],
        female: ['Coya', 'Killa', 'Mama', 'Ñusta', 'Quispe', 'Sisa', 'Sumaq', 'Tika', 'Urpi', 'Wayna', 'Yaku', 'Chaska', 'Chuya', 'Illa', 'Inti', 'Kusi', 'Phuyupatamanta', 'Qori', 'Raymi', 'Sarita', 'Tanta', 'Umiña', 'Warmi', 'Yana', 'Achik', 'Chakana', 'Hanan', 'Khuya', 'Munay', 'Phaway'],
        surname: ['Yupanki', 'Wankár', 'Quespi', 'Kondori', 'Waman', 'Amaru', 'Choque', 'Quispe', 'Huanca', 'Mamani', 'Flores', 'Apaza', 'Ccopa', 'Cusipaucar', 'Hancco', 'Inca', 'Llanos', 'Marca', 'Nina', 'Pacco', 'Quiso', 'Ramos', 'Soncco', 'Ttito', 'Vargas', 'Waskar', 'Xerez', 'Yabar', 'Zapana', 'Alanoca']
    },
    SUB_SAHARAN_AFRICAN: {
        male: ['Kwame', 'Abebe', 'Chinedu', 'Musa', 'Babatunde', 'Adebayo', 'Chukwuemeka', 'Damilola', 'Emeka', 'Folarin', 'Gbenga', 'Hakeem', 'Idris', 'Jide', 'Kemi', 'Lanre', 'Muyiwa', 'Niyi', 'Olu', 'Pelumi', 'Rotimi', 'Segun', 'Tunde', 'Uche', 'Wale', 'Yemi', 'Adamu', 'Bolaji', 'Chidi', 'Dayo'],
        female: ['Aba', 'Imani', 'Zola', 'Nia', 'Asha', 'Adunni', 'Bisi', 'Chioma', 'Dupe', 'Ebun', 'Funmi', 'Gbemi', 'Hadiza', 'Ife', 'Joke', 'Kemi', 'Lola', 'Moji', 'Nike', 'Ope', 'Peju', 'Ronke', 'Sade', 'Titi', 'Uche', 'Wunmi', 'Yemi', 'Abisola', 'Bukola', 'Chiamaka'],
        surname: ['Okoro', 'Diallo', 'Traoré', 'Nkosi', 'Adebayo', 'Babatunde', 'Ogundimu', 'Oluwaseun', 'Adeyemi', 'Ogundipe', 'Adesanya', 'Oyebanji', 'Oladapo', 'Adebisi', 'Oguntade', 'Akinwale', 'Ogunbayo', 'Adebola', 'Oyewole', 'Adesola', 'Ogundare', 'Akinola', 'Ogunleye', 'Adewale', 'Oyekanmi', 'Adekunle', 'Ogundiran', 'Akinyemi', 'Ogunmola', 'Adeniyi']
    },

    // === COLONIAL PERIOD NAMES ===
    NORTH_AMERICAN_COLONIAL: {
        male: ['John', 'William', 'Thomas', 'Robert', 'James', 'Richard', 'Edward', 'Henry', 'Walter', 'Samuel', 'Benjamin', 'Nathaniel', 'Jonathan', 'Daniel', 'David', 'Isaac', 'Jacob', 'Joshua', 'Ezekiel', 'Jeremiah', 'Ebenezer', 'Cornelius', 'Barnabas', 'Gideon', 'Caleb', 'Elijah', 'Josiah', 'Zechariah', 'Obadiah', 'Hezekiah'],
        female: ['Mary', 'Elizabeth', 'Sarah', 'Hannah', 'Rebecca', 'Ruth', 'Esther', 'Rachel', 'Deborah', 'Abigail', 'Martha', 'Lydia', 'Priscilla', 'Susanna', 'Charity', 'Faith', 'Hope', 'Patience', 'Temperance', 'Prudence', 'Mercy', 'Comfort', 'Submit', 'Silence', 'Experience', 'Thankful', 'Deliverance', 'Bathsheba', 'Mehitable', 'Keturah'],
        surname: ['Smith', 'Brown', 'Johnson', 'Williams', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King']
    }
};

export const REGION_NAME_MAPPING: Record<string, Record<string, Array<{
    before?: number;
    after?: number;
    keys: string[];
}>>> = {
    "EUROPEAN": {
        "Italy": [
            { before: 476, keys: ['ANCIENT_ROMAN'] },
            { after: 476, before: 800, keys: ['BYZANTINE', 'ITALIAN'] },
            { after: 800, keys: ['ITALIAN'] }
        ],
        "France": [
            { before: 486, keys: ['ANCIENT_ROMAN', 'FRANKISH_MEROVINGIAN'] },
            { after: 486, before: 751, keys: ['FRANKISH_MEROVINGIAN'] },
            { after: 751, before: 987, keys: ['FRANKISH_CAROLINGIAN'] },
            { after: 987, before: 1100, keys: ['FRENCH_MEDIEVAL'] },
            { after: 1100, before: 1450, keys: ['NORMAN_FRENCH', 'FRENCH_MEDIEVAL'] },
            { after: 1450, keys: ['FRENCH'] }
        ],
        "Greece and Aegean": [
            { before: 146, keys: ['ANCIENT_GREEK'] },
            { after: 146, before: 330, keys: ['ANCIENT_GREEK', 'ANCIENT_ROMAN'] },
            { after: 330, before: 1453, keys: ['BYZANTINE', 'GREEK'] },
            { after: 1453, keys: ['GREEK', 'TURKISH'] }
        ],
        "British Isles": [
            { before: 410, keys: ['CELTIC_IRISH', 'WELSH', 'ANCIENT_ROMAN'] },
            { after: 410, before: 800, keys: ['ENGLISH_ANGLO_SAXON', 'CELTIC_IRISH', 'WELSH', 'SCOTTISH'] },
            { after: 800, before: 1066, keys: ['ENGLISH_ANGLO_SAXON', 'CELTIC_IRISH', 'WELSH', 'SCOTTISH', 'SCANDINAVIAN'] },
            { after: 1066, before: 1300, keys: ['ENGLISH_MEDIEVAL', 'NORMAN_FRENCH', 'SCOTTISH', 'WELSH', 'CELTIC_IRISH'] },
            { after: 1300, keys: ['ENGLISH', 'SCOTTISH', 'WELSH', 'CELTIC_IRISH'] }
        ],
        "Iberian Peninsula": [
            { before: 711, keys: ['SPANISH_CASTILIAN', 'PORTUGUESE', 'ANCIENT_ROMAN'] },
            { after: 711, before: 1492, keys: ['SPANISH_CASTILIAN', 'PORTUGUESE', 'ARABIC_LEVANT', 'HEBREW', 'BERBER_AMAZIGH'] },
            { after: 1492, keys: ['SPANISH_CASTILIAN', 'PORTUGUESE'] }
        ],
        "Germanic Lands": [
            { before: 400, keys: ['ANCIENT_ROMAN', 'GERMAN'] },
            { after: 400, before: 800, keys: ['FRANKISH_MEROVINGIAN', 'GERMAN'] },
            { after: 800, before: 1000, keys: ['FRANKISH_CAROLINGIAN', 'GERMAN'] },
            { after: 1000, keys: ['GERMAN'] }
        ],
        "Scandinavia": [
            { before: 1000, keys: ['SCANDINAVIAN'] },
            { after: 1000, keys: ['SCANDINAVIAN'] }
        ],
        "Eastern Europe": [
            { before: 800, keys: ['SLAVIC_MEDIEVAL', 'BYZANTINE'] },
            { after: 800, before: 1000, keys: ['SLAVIC_MEDIEVAL', 'BYZANTINE', 'RUSSIAN'] },
            { after: 1000, before: 1500, keys: ['RUSSIAN', 'POLISH', 'HUNGARIAN', 'BOHEMIAN'] },
            { after: 1500, before: 1918, keys: ['POLISH', 'HUNGARIAN', 'BOHEMIAN', 'GERMAN'] },
            { after: 1918, before: 1945, keys: ['POLISH_MODERN', 'CZECH_MODERN', 'SLOVAK_MODERN', 'HUNGARIAN_MODERN', 'ROMANIAN'] },
            { after: 1945, before: 1990, keys: ['POLISH_MODERN', 'CZECH_MODERN', 'SLOVAK_MODERN', 'HUNGARIAN_MODERN', 'EAST_GERMAN', 'YUGOSLAV', 'ROMANIAN'] },
            { after: 1990, keys: ['POLISH_MODERN', 'CZECH_MODERN', 'SLOVAK_MODERN', 'HUNGARIAN_MODERN', 'ROMANIAN'] }
        ],
        "Carpathian Foothills": [
            { before: 1000, keys: ['SLAVIC_MEDIEVAL'] },
            { after: 1000, before: 1500, keys: ['POLISH', 'HUNGARIAN', 'BOHEMIAN'] },
            { after: 1500, before: 1918, keys: ['POLISH', 'HUNGARIAN', 'BOHEMIAN', 'GERMAN'] },
            { after: 1918, before: 1945, keys: ['POLISH_MODERN', 'CZECH_MODERN', 'SLOVAK_MODERN', 'HUNGARIAN_MODERN', 'ROMANIAN'] },
            { after: 1945, before: 1990, keys: ['POLISH_MODERN', 'CZECH_MODERN', 'SLOVAK_MODERN', 'EAST_GERMAN', 'ROMANIAN'] },
            { after: 1990, keys: ['POLISH_MODERN', 'CZECH_MODERN', 'SLOVAK_MODERN', 'ROMANIAN'] }
        ]
    },
    "NORTH_AMERICAN_COLONIAL": {
        "Atlantic Coast": [
            { after: 1607, before: 1776, keys: ['NORTH_AMERICAN_COLONIAL', 'ENGLISH', 'DUTCH'] },
            { after: 1776, before: 1840, keys: ['NORTH_AMERICAN_COLONIAL', 'ENGLISH'] },
            { after: 1840, keys: ['ENGLISH', 'CELTIC_IRISH', 'GERMAN', 'ITALIAN'] }
        ],
        "Southwest": [
            { after: 1540, before: 1821, keys: ['SPANISH_CASTILIAN', 'PUEBLO'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN', 'PUEBLO'] }
        ],
        "Great Lakes": [
            { after: 1600, before: 1776, keys: ['FRENCH', 'NORTH_AMERICAN_ALGONQUIAN'] },
            { after: 1776, keys: ['NORTH_AMERICAN_COLONIAL', 'FRENCH', 'NORTH_AMERICAN_ALGONQUIAN'] }
        ]
    },
    "NORTH_AMERICAN_PRE_COLUMBIAN": {
        "Atlantic Coast": [
            { keys: ['NORTH_AMERICAN_ALGONQUIAN'] }
        ],
        "Northeast Woodlands": [
            { keys: ['IROQUOIAN', 'NORTH_AMERICAN_ALGONQUIAN'] }
        ],
        "Southwest": [
            { keys: ['PUEBLO'] }
        ],
        "Great Plains": [
            { keys: ['PLAINS_NATIVE'] }
        ]
    },
    "EAST_ASIAN": {
        "North China Plain": [ 
            { before: 220, keys: ['CHINESE_MANDARIN'] },
            { after: 220, keys: ['CHINESE_MANDARIN'] }
        ],
        "South China": [ 
            { before: 220, keys: ['CHINESE_CANTONESE'] },
            { after: 220, keys: ['CHINESE_CANTONESE', 'VIETNAMESE'] }
        ],
        "Korean Peninsula": [
            { before: 1392, keys: ['KOREAN'] },
            { after: 1392, keys: ['KOREAN'] }
        ],
        "Japanese Archipelago": [
            { before: 1185, keys: ['JAPANESE'] },
            { after: 1185, keys: ['JAPANESE'] }
        ],
        "Mongolia": [
            { before: 1206, keys: ['MONGOLIAN'] },
            { after: 1206, keys: ['MONGOLIAN'] }
        ]
    },
    "SOUTH_AMERICAN": {
        "Andes North": [
            { before: 1532, keys: ['ANDEAN_QUECHUA'] },
            { after: 1532, keys: ['SPANISH_LATIN_AMERICAN', 'ANDEAN_QUECHUA'] }
        ],
        "Atlantic Coast": [
            { before: 1500, keys: ['GUARANI'] },
            { after: 1500, keys: ['PORTUGUESE_BRAZIL', 'GUARANI'] }
        ],
        "Patagonia": [
            { before: 1520, keys: ['GUARANI'] },
            { after: 1520, keys: ['SPANISH_LATIN_AMERICAN'] }
        ]
    },
    "MENA": {
        "Levant": [
            { before: 636, keys: ['BYZANTINE', 'ARAMAIC', 'HEBREW'] },
            { after: 636, keys: ['ARABIC_LEVANT', 'HEBREW', 'ARMENIAN'] }
        ],
        "Persia": [
            { before: 651, keys: ['PERSIAN_FARSI'] },
            { after: 651, keys: ['PERSIAN_FARSI', 'ARABIC_LEVANT'] }
        ],
        "Persian Khorasan": [
            { keys: ['PERSIAN_KHORASAN'] }
        ],
        "Anatolia": [
            { before: 1071, keys: ['BYZANTINE', 'ARMENIAN'] },
            { after: 1071, before: 1453, keys: ['BYZANTINE', 'TURKISH', 'ARMENIAN'] },
            { after: 1453, keys: ['TURKISH', 'ARMENIAN', 'GREEK'] }
        ],
        "Arabia": [
            { before: 622, keys: ['ARABIC_LEVANT'] },
            { after: 622, keys: ['ARABIC_LEVANT'] }
        ],
        "Hejaz Mountains": [
            { keys: ['ARABIAN_HEJAZ'] }
        ],
        "Red Sea Coast Yemen": [
            { keys: ['ARABIC_LEVANT'] }
        ],
        "North Africa": [
            { before: 647, keys: ['BERBER_AMAZIGH', 'BYZANTINE'] },
            { after: 647, keys: ['ARABIC_LEVANT', 'BERBER_AMAZIGH'] }
        ]
    },
    "SOUTH_ASIAN": {
        "Northern India": [
            { before: 1200, keys: ['HINDI'] },
            { after: 1200, keys: ['HINDI', 'PERSIAN_FARSI'] }
        ],
        "Bengal": [
            { before: 1200, keys: ['BENGALI'] },
            { after: 1200, keys: ['BENGALI', 'PERSIAN_FARSI'] }
        ],
        "Southern India": [
            { before: 1300, keys: ['TAMIL'] },
            { after: 1300, keys: ['TAMIL'] }
        ],
        "Punjab": [
            { before: 1000, keys: ['PUNJABI'] },
            { after: 1000, keys: ['PUNJABI', 'PERSIAN_FARSI'] }
        ]
    },
    "SUB_SAHARAN_AFRICAN": {
        "West Africa": [
            { before: 1000, keys: ['YORUBA'] },
            { after: 1000, keys: ['YORUBA'] }
        ],
        "East Africa": [
            { before: 1000, keys: ['SWAHILI'] },
            { after: 1000, keys: ['SWAHILI', 'ARABIC_LEVANT'] }
        ],
        "Horn of Africa": [
            { before: 1000, keys: ['AMHARIC'] },
            { after: 1000, keys: ['AMHARIC', 'ARABIC_LEVANT'] }
        ],
        "Southern Africa": [
            { before: 1000, keys: ['ZULU'] },
            { after: 1000, keys: ['ZULU'] }
        ]
    },
    "OCEANIA": {
        "Polynesia": [
            { keys: ['POLYNESIAN'] }
        ],
        "Melanesia": [
            { keys: ['MELANESIAN'] }
        ],
        "Australia": [
            { keys: ['ABORIGINAL_AUSTRALIAN'] }
        ]
    }
};

/**
 * Enhanced period-specific name mappings for better historical accuracy
 */
export const PERIOD_NAME_MAPPING: Record<string, Record<string, string[]>> = {
    "EUROPEAN": {
        "antiquity": ['ANCIENT_GREEK', 'ANCIENT_ROMAN'],
        "early_medieval": ['FRANKISH_MEROVINGIAN', 'FRANKISH_CAROLINGIAN', 'ENGLISH_ANGLO_SAXON', 'BYZANTINE', 'SLAVIC_MEDIEVAL'],
        "high_medieval": ['ENGLISH_MEDIEVAL', 'FRENCH_MEDIEVAL', 'NORMAN_FRENCH', 'BYZANTINE', 'SLAVIC_MEDIEVAL', 'HUNGARIAN', 'POLISH'],
        "late_medieval": ['ENGLISH_MEDIEVAL', 'FRENCH_MEDIEVAL', 'ITALIAN', 'GERMAN', 'SPANISH_CASTILIAN', 'PORTUGUESE'],
        "renaissance": ['ENGLISH', 'FRENCH', 'ITALIAN', 'GERMAN', 'SPANISH_CASTILIAN', 'PORTUGUESE'],
        "early_modern": ['ENGLISH', 'FRENCH', 'ITALIAN', 'GERMAN', 'SPANISH_CASTILIAN', 'PORTUGUESE', 'DUTCH', 'SCANDINAVIAN'],
        "industrial": ['ENGLISH', 'FRENCH', 'ITALIAN', 'GERMAN', 'RUSSIAN', 'SCANDINAVIAN'],
        "modern": ['ENGLISH', 'FRENCH', 'ITALIAN', 'GERMAN', 'RUSSIAN', 'SCANDINAVIAN', 'GREEK']
    },
    "NORTH_AMERICAN_PRE_COLUMBIAN": {
        "antiquity": ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'PUEBLO', 'PLAINS_NATIVE'],
        "early_medieval": ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'PUEBLO', 'PLAINS_NATIVE'],
        "high_medieval": ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'PUEBLO', 'PLAINS_NATIVE'],
        "late_medieval": ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'PUEBLO', 'PLAINS_NATIVE'],
        "renaissance": ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'PUEBLO', 'PLAINS_NATIVE'],
        "early_modern": ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'PUEBLO', 'PLAINS_NATIVE'],
        "industrial": ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'PUEBLO', 'PLAINS_NATIVE'],
        "modern": ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'PUEBLO', 'PLAINS_NATIVE']
    }
};

/**
 * Helper function to get available cultural groups for a region and time period
 */
export function getCulturalGroupsForRegion(
    continent: string, 
    region: string, 
    year?: number
): string[] {
    const continentData = REGION_NAME_MAPPING[continent];
    if (!continentData) return [];
    
    const regionData = continentData[region];
    if (!regionData) return [];
    
    const currentYear = year || new Date().getFullYear();
    
    for (const period of regionData) {
        const beforeMatch = !period.before || currentYear < period.before;
        const afterMatch = !period.after || currentYear >= period.after;
        
        if (beforeMatch && afterMatch) {
            return period.keys;
        }
    }
    
    return [];
}

/**
 * Helper function to get cultural groups by historical period
 */
export function getCulturalGroupsByPeriod(
    continent: string,
    period: 'antiquity' | 'early_medieval' | 'high_medieval' | 'late_medieval' | 'renaissance' | 'early_modern' | 'industrial' | 'modern'
): string[] {
    const periodData = PERIOD_NAME_MAPPING[continent];
    if (!periodData) return [];
    
    return periodData[period] || [];
}

/**
 * Helper function to generate a random name from available cultural groups
 */
export function generateRandomName(
    culturalGroups: string[], 
    gender: 'male' | 'female',
    options: NameGenerationOptions = {}
): { firstName: string; surname: string; culturalGroup: string } {
    if (culturalGroups.length === 0) {
        culturalGroups = ['EUROPEAN']; // Fallback
    }
    
    const randomGroup = culturalGroups[Math.floor(Math.random() * culturalGroups.length)];
    const nameList = CHARACTER_NAMES[randomGroup];
    
    if (!nameList) {
        throw new Error(`Cultural group "${randomGroup}" not found in CHARACTER_NAMES`);
    }
    
    const firstNames = nameList[gender];
    const surnames = nameList.surname;
    
    // Filter by historical period preference if specified
    let filteredFirstNames = firstNames;
    if (options.historicalPeriod && options.preferCommonNames) {
        // For historical accuracy, prefer names from earlier in the list for earlier periods
        const nameCount = Math.floor(firstNames.length * 0.6); // Use first 60% for historical periods
        filteredFirstNames = firstNames.slice(0, nameCount);
    }
    
    const firstName = filteredFirstNames[Math.floor(Math.random() * filteredFirstNames.length)];
    let surname = surnames[Math.floor(Math.random() * surnames.length)];
    
    // Handle cultures without traditional surnames
    if (surname === '(No Surname)' && !options.allowNoSurname) {
        surname = '';
    }
    
    return {
        firstName,
        surname,
        culturalGroup: randomGroup
    };
}

/**
 * Helper function to get historically appropriate name based on year and location
 */
export function generateHistoricalName(
    continent: string,
    region: string,
    year: number,
    gender: 'male' | 'female',
    options: NameGenerationOptions = {}
): { firstName: string; surname: string; culturalGroup: string } {
    // Get period-appropriate cultural groups
    const regionGroups = getCulturalGroupsForRegion(continent, region, year);
    
    // Enhance with period-specific groups if available
    const period = getHistoricalPeriod(year);
    const periodGroups = getCulturalGroupsByPeriod(continent, period);
    
    // Combine and deduplicate
    const allGroups = [...new Set([...regionGroups, ...periodGroups])];
    
    if (allGroups.length === 0) {
        // Fallback to continent-wide groups
        const fallbackGroups = getCulturalGroupsByZone(continent as CulturalZone);
        return generateRandomName(fallbackGroups, gender, { ...options, historicalPeriod: period });
    }
    
    return generateRandomName(allGroups, gender, { ...options, historicalPeriod: period });
}

/**
 * Helper function to determine historical period from year
 */
export function getHistoricalPeriod(year: number): 'antiquity' | 'early_medieval' | 'high_medieval' | 'late_medieval' | 'renaissance' | 'early_modern' | 'industrial' | 'modern' {
    if (year < 500) return 'antiquity';
    if (year < 1000) return 'early_medieval';
    if (year < 1300) return 'high_medieval';
    if (year < 1450) return 'late_medieval';
    if (year < 1600) return 'renaissance';
    if (year < 1800) return 'early_modern';
    if (year < 1900) return 'industrial';
    return 'modern';
}

/**
 * Helper function to get all available cultural groups
 */
export function getAllCulturalGroups(): string[] {
    return Object.keys(CHARACTER_NAMES);
}

/**
 * Helper function to get cultural groups by zone
 */
export function getCulturalGroupsByZone(zone: CulturalZone): string[] {
    const groups = Object.keys(CHARACTER_NAMES);
    
    switch (zone) {
        case 'EUROPEAN':
            return groups.filter(g => 
                ['ANCIENT_GREEK', 'ANCIENT_ROMAN', 'FRANKISH_MEROVINGIAN', 'FRANKISH_CAROLINGIAN', 'NORMAN_FRENCH', 'FRENCH_MEDIEVAL', 'ENGLISH_ANGLO_SAXON', 'ENGLISH_MEDIEVAL', 'ENGLISH', 'SPANISH_CASTILIAN', 'PORTUGUESE', 'ITALIAN', 'FRENCH', 'GERMAN', 'RUSSIAN', 'GREEK', 'CELTIC_IRISH', 'WELSH', 'SCOTTISH', 'DUTCH', 'SCANDINAVIAN', 'BYZANTINE', 'SLAVIC_MEDIEVAL', 'HUNGARIAN', 'POLISH', 'BOHEMIAN', 'ARMENIAN', 'GEORGIAN', 'EUROPEAN'].includes(g)
            );
        case 'EAST_ASIAN':
            return groups.filter(g => 
                ['JAPANESE', 'CHINESE_MANDARIN', 'CHINESE_CANTONESE', 'KOREAN', 'VIETNAMESE', 'THAI', 'MONGOLIAN', 'EAST_ASIAN'].includes(g)
            );
        case 'MENA':
            return groups.filter(g => 
                ['ARABIC_LEVANT', 'PERSIAN_FARSI', 'TURKISH', 'HEBREW', 'BERBER_AMAZIGH', 'MENA'].includes(g)
            );
        case 'SOUTH_ASIAN':
            return groups.filter(g => 
                ['HINDI', 'BENGALI', 'TAMIL', 'PUNJABI', 'SOUTH_ASIAN'].includes(g)
            );
        case 'SUB_SAHARAN_AFRICAN':
            return groups.filter(g => 
                ['YORUBA', 'SWAHILI', 'AMHARIC', 'ZULU', 'SUB_SAHARAN_AFRICAN'].includes(g)
            );
        case 'OCEANIA':
            return groups.filter(g => 
                ['POLYNESIAN', 'MELANESIAN', 'ABORIGINAL_AUSTRALIAN', 'OCEANIA'].includes(g)
            );
        case 'SOUTH_AMERICAN':
            return groups.filter(g => 
                ['ANDEAN_QUECHUA', 'GUARANI', 'SOUTH_AMERICAN', 'SPANISH_LATIN_AMERICAN', 'PORTUGUESE_BRAZIL'].includes(g)
            );
        case 'NORTH_AMERICAN_PRE_COLUMBIAN':
            return groups.filter(g => 
                ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'PUEBLO', 'PLAINS_NATIVE', 'NORTH_AMERICAN_PRE_COLUMBIAN'].includes(g)
            );
        case 'NORTH_AMERICAN_COLONIAL':
            return groups.filter(g => 
                ['NORTH_AMERICAN_COLONIAL', 'ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN', 'DUTCH'].includes(g)
            );
        default:
            return groups;
    }
}