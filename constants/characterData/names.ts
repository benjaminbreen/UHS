/**
 * constants/characterData/names.ts - Comprehensive data for procedural name generation.
 */
import { CulturalZone } from '../../types/characterData';

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
    // === PREHISTORIC UNIVERSAL ===
    // Proto-Indo-European and Early European (3500-500 BCE)
   // Proto-Indo-European (c. 4500-2500 BCE) - The ancestor of most European languages.
    PREHISTORIC_PROTO_INDO_EUROPEAN: {
        male: ['Hrewiklewos', 'Gostiregs', 'Wulkwowiros', 'Aryomon', 'Perkwugnatos', 'Supotis', 'Dewostos', 'Tritoneros', 'Monyemos', 'Ekwomedos', 'Wesugenos', 'Dorudekus'],
        female: ['Awsosdota', 'Diwosdugater', 'Wulkwiya', 'Swaduwena', 'Aryona', 'Gwenaregna', 'Wesutoka', 'Priyagentri', 'Tritogena', 'Sowlya'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // Proto-Celtic (c. 1000-500 BCE) - Ancestor of Gaulish, Irish, Welsh. Iron Age feel.
    PREHISTORIC_PROTO_CELTIC: {
        male: ['Wirorix', 'Catumaros', 'Dumnovalos', 'Brigantagnos', 'Cunobelinos', 'Epomanduos', 'Toutovaldos', 'Vindoviros', 'Ariovestos', 'Bodugnatos', 'Tigernomaglos', 'Segoviros'],
        female: ['Vindoriga', 'Catubodua', 'Brigantina', 'Eponina', 'Toutavalda', 'Adtreba', 'Rigana', 'Boudica', 'Segovella', 'Vindatreba'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // Proto-Germanic (c. 500 BCE - 200 CE) - Ancestor of Norse, English, German. Migration Period feel.
    PREHISTORIC_PROTO_GERMANIC: {
        male: ['Haþuwulf', 'Audariks', 'Hroþigaiz', 'Sigimer', 'Gudawer', 'Þeudariks', 'Agilhard', 'Wulþuhar', 'Ermanariks', 'Beranhard', 'Hailagamund', 'Harjawald'],
        female: ['Hildigunþ', 'Hroþirun', 'Swanhild', 'Audagard', 'Merahild', 'Gudalind', 'Brunjohild', 'Fasturun', 'Albigard', 'Sigilind'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    PREHISTORIC_MENA: {
        male: ['Atum', 'Khenti', 'Menes', 'Narmer', 'Scorpion', 'Ka', 'Iry-Hor', 'Abydos', 'Hierakonpolis', 'Naqada', 'Badari', 'Merimde', 'Fayum', 'Omari', 'Maadi', 'Tasian', 'Hamza', 'Yusuf', 'Ibrahim', 'Musa'],
        female: ['Neithhotep', 'Merneith', 'Herneith', 'Nakhtneith', 'Khenthap', 'Betresh', 'Ahhotep', 'Tetisheri', 'Amenirdis', 'Nitocris', 'Ankhesenamun', 'Nefertiti', 'Hatshepsut', 'Cleopatra', 'Berenice', 'Arsinoe', 'Layla', 'Zahra', 'Fatima', 'Amina'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    // Ancient Chinese & Proto-Mongolic (3000 BCE - 200 CE)
    PREHISTORIC_ASIAN: {
        male: ['*Tengri', '*Bayar', '*Temür', '*Batu', '*Börte', 'Yao', 'Shun', 'Yu', 'Tang', 'Wu', 'Zhou', 'Fuxi', 'Shennong', 'Huangdi', 'Zhuanxu', 'Ku', 'Gun', 'Qi', 'Gao', 'Jie', 'Li', 'Pan', 'Geng', 'Xin'],
        female: ['*Gua', '*Eke', '*Aba', 'Nüwa', 'Leizu', 'Luozu', 'Fufei', 'Ehuang', 'Nüying', 'Changxi', 'Xihe', 'Jiandi', 'Jiangyuan', 'Tushan', 'Nvjiao', 'Moxi', 'Baosi', 'Daji', 'Bao', 'Gui', 'Jiang', 'Ji'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    PREHISTORIC_AFRICAN: {
        male: ['Aman', 'Kofi', 'Kwame', 'Nkrumah', 'Osei', 'Mensah', 'Adjei', 'Asante', 'Kente', 'Zuberi', 'Jabari', 'Omari', 'Sekou', 'Chike', 'Dume', 'Kato', 'Jengo', 'Baraka', 'Hasani', 'Imara'],
        female: ['Ama', 'Efua', 'Akosua', 'Adwoa', 'Yaa', 'Afia', 'Abena', 'Nana', 'Makena', 'Asha', 'Khadija', 'Zara', 'Amara', 'Nia', 'Imani', 'Sanaa', 'Dalila', 'Hasina', 'Jumoke', 'Kesia'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    PREHISTORIC_AMERICAN: {
        male: ['Sky', 'River', 'Stone', 'Bear', 'Wolf', 'Eagle', 'Hawk', 'Thunder', 'Wind', 'Fire', 'Mountain', 'Forest', 'Hunter', 'Warrior', 'Chief', 'Shaman', 'Arrow', 'Spear', 'Shield', 'Drum'],
        female: ['Moon', 'Star', 'Dawn', 'Rain', 'Snow', 'Flower', 'Willow', 'Rose', 'Sky', 'River', 'Spring', 'Summer', 'Autumn', 'Winter', 'Dove', 'Deer', 'Butterfly', 'Raven', 'Swan', 'Lily'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    PREHISTORIC_OCEANIC: {
        male: ['Maui', 'Tane', 'Rangi', 'Papa', 'Tangaroa', 'Rongo', 'Tu', 'Tawhiri', 'Haumia', 'Ruaumoko', 'Kupe', 'Tiki', 'Paikea', 'Tinirau', 'Turi', 'Whatonga', 'Hoturapa', 'Pourangahua', 'Tama', 'Rua'],
        female: ['Hina', 'Pele', 'Namaka', 'Poliahu', 'Lilinoe', 'Waiau', 'Kahoupokane', 'Laka', 'Kapo', 'Hiiaka', 'Sina', 'Taranga', 'Murirangawhenua', 'Rongomaiwahine', 'Wairaka', 'Hinemoa', 'Mahuika', 'Muriranga', 'Para', 'Kui'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
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
    
    // === DIVERSE AMERICAN IMMIGRANT NAMES ===
    JEWISH_ASHKENAZI: {
        male: ['David', 'Isaac', 'Jacob', 'Abraham', 'Samuel', 'Benjamin', 'Solomon', 'Moses', 'Aaron', 'Joseph', 'Nathan', 'Eli', 'Daniel', 'Michael', 'Gabriel', 'Raphael', 'Simon', 'Reuben', 'Levi', 'Judah'],
        female: ['Sarah', 'Rebecca', 'Rachel', 'Leah', 'Miriam', 'Esther', 'Ruth', 'Naomi', 'Hannah', 'Deborah', 'Judith', 'Rose', 'Sophie', 'Anna', 'Clara', 'Bella', 'Ida', 'Fanny', 'Minnie', 'Molly'],
        surname: ['Cohen', 'Levy', 'Goldman', 'Friedman', 'Rosenberg', 'Goldstein', 'Silverman', 'Katz', 'Shapiro', 'Weinstein', 'Klein', 'Schwartz', 'Weiss', 'Hoffman', 'Green', 'Stone', 'Miller', 'Roth', 'Stein', 'Berg']
    },
    PUERTO_RICAN: {
        male: ['Juan', 'Luis', 'Carlos', 'José', 'Miguel', 'Angel', 'Francisco', 'Antonio', 'Manuel', 'Pedro', 'Rafael', 'Roberto', 'Jorge', 'Ricardo', 'Eduardo', 'Alberto', 'Hector', 'Ramón', 'Fernando', 'Diego'],
        female: ['Maria', 'Carmen', 'Rosa', 'Ana', 'Luz', 'Gloria', 'Isabel', 'Teresa', 'Sonia', 'Laura', 'Patricia', 'Sandra', 'Monica', 'Julia', 'Adriana', 'Beatriz', 'Elena', 'Cristina', 'Dolores', 'Esperanza'],
        surname: ['Rodriguez', 'Rivera', 'Gonzalez', 'Torres', 'Martinez', 'Diaz', 'Hernandez', 'Lopez', 'Perez', 'Sanchez', 'Ramirez', 'Cruz', 'Morales', 'Ortiz', 'Gomez', 'Reyes', 'Ruiz', 'Flores', 'Santiago', 'Castro']
    },
    AFRICAN_AMERICAN: {
        male: ['William', 'James', 'John', 'Robert', 'George', 'Charles', 'Joseph', 'Thomas', 'Henry', 'Walter', 'Arthur', 'Fred', 'Albert', 'Samuel', 'David', 'Louis', 'Charlie', 'Richard', 'Ernest', 'Roy'],
        female: ['Mary', 'Ruth', 'Helen', 'Margaret', 'Elizabeth', 'Dorothy', 'Betty', 'Patricia', 'Barbara', 'Shirley', 'Sarah', 'Annie', 'Clara', 'Emma', 'Minnie', 'Rosa', 'Grace', 'Ella', 'Florence', 'Louise'],
        surname: ['Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Smith', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Robinson', 'Lewis', 'Walker', 'Allen', 'Young', 'King', 'Wright', 'Hill', 'Green']
    },
    AZTEC: {
        male: ['Itzel', 'Cuauhtemoc', 'Moctezuma', 'Tlacaelel', 'Nezahualcoyotl', 'Axayacatl', 'Tizoc', 'Ahuitzotl', 'Chimalpopoca', 'Itzcoatl', 'Huitzilihuitl', 'Acamapichtli', 'Tenoch', 'Xochitl', 'Cipac', 'Coatl', 'Ehecatl', 'Ixtli', 'Ocelotl', 'Tochtli'],
        female: ['Xochitl', 'Itzel', 'Citlali', 'Tlazohtzin', 'Ixchel', 'Malintzin', 'Quetzali', 'Yaretzi', 'Nenetl', 'Cihuaton', 'Izel', 'Metztli', 'Tonalnan', 'Xilonen', 'Chalchiuhtlicue', 'Coatlicue', 'Itzpapalotl', 'Mayahuel', 'Tlaltecuhtli', 'Tonantzin'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === MESOAMERICAN CULTURES ===
    MAYA: {
        male: ['Kinich', 'Itzamna', 'Hunab', 'Ahau', 'Balam', 'Kanek', 'Tepeu', 'Ahkin', 'Ah Mun', 'Bolon', 'Canul', 'Dzul', 'Hunac', 'Ixbalanque', 'Hunahpu', 'Kukulkan', 'Akbal', 'Cauac', 'Chicchan', 'Cimi', 'Eb', 'Etznab', 'Kan', 'Muluc', 'Oc', 'Uayeb', 'Yaxkin', 'Zotz', 'Pop', 'Ceh'],
        female: ['Ixchel', 'Itzel', 'Akna', 'Citlali', 'Nicte', 'Sak', 'Itzayani', 'Ixkawil', 'Ixnikte', 'Ixchup', 'Colel', 'Alitzel', 'Xunah', 'Yatzil', 'Zumanil', 'Ixtab', 'Ixcacao', 'Ixik', 'Naab', 'Sacnikte', 'Chimalmat', 'Xoc', 'Xquic', 'Blood Moon', 'Jade Sky', 'Shell Star', 'Flower Serpent', 'Moon Bird', 'Water Lily', 'Dawn Star'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    ZAPOTEC: {
        male: ['Cosijoeza', 'Cosijopii', 'Zaachila', 'Huijatoo', 'Ozomatli', 'Petela', 'Bixabeani', 'Quiabelagayo', 'Pitao', 'Cocijo', 'Cocijobi', 'Cosana', 'Huechaana', 'Lachi', 'Nadodo', 'Pecala', 'Quialana', 'Teitipac', 'Xadani', 'Yagul', 'Zachila', 'Zoque', 'Guigu', 'Niza', 'Bixidu'],
        female: ['Donaji', 'Xunaxhi', 'Guenda', 'Itandehui', 'Nayeli', 'Lupita', 'Benda', 'Dani', 'Guela', 'Laxsi', 'Naxieli', 'Stina', 'Xhopa', 'Yadira', 'Zianya', 'Belazi', 'Celia', 'Gabi', 'Ixel', 'Janu'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    MIXTEC: {
        male: ['Dzahuindanda', 'Ocoñaña', 'Atonal', 'Tilantongo', 'Tututepec', 'Yahui', 'Savi', 'Ndikandii', 'Tayuva', 'Tikuun', 'Tikaa', 'Tniumi', 'Ndaa', 'Yuku', 'Kava', 'Koo', 'Kuii', 'Ndiyo', 'Soko', 'Tachi'],
        female: ['Dzehe', 'Sitna', 'Yuku', 'Ndaa', 'Savi', 'Ita', 'Yodo', 'Dzita', 'Nuu', 'Yuta', 'Ndivi', 'Sii', 'Yaa', 'Xini', 'Tinduu', 'Kuñu', 'Nduchi', 'Yutsa', 'Ñuhu', 'Xiyo'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === CARIBBEAN ===
    TAINO: {
        male: ['Guacanagarix', 'Caonabo', 'Cacimar', 'Guarionex', 'Agueybana', 'Hatuey', 'Guacanagari', 'Behequio', 'Cayacoa', 'Mayobanex', 'Caguax', 'Guarocuya', 'Arasibo', 'Bairoa', 'Caguas', 'Daguao', 'Humacao', 'Jayuya', 'Loiza', 'Mabodamaca', 'Orocobix', 'Tabonuco', 'Urayoan', 'Yabucoa', 'Yuisa'],
        female: ['Anacaona', 'Yuisa', 'Casiguaya', 'Guasabara', 'Higuenamota', 'Nimita', 'Abey', 'Aji', 'Anani', 'Bagua', 'Bayoya', 'Cacica', 'Caona', 'Catalina', 'Ceiba', 'Cuaba', 'Guabina', 'Guama', 'Jagua', 'Maroya', 'Ocama', 'Siboney', 'Tonina', 'Yaima', 'Zunilda'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    CARIB: {
        male: ['Kalinago', 'Tegremond', 'Waikeri', 'Arouca', 'Chatoyer', 'Caribice', 'Kairouane', 'Mabouka', 'Ouacabo', 'Pakiri', 'Tourouya', 'Yarima', 'Kenaima', 'Makuri', 'Parima', 'Tamosi', 'Warapa', 'Wowora', 'Yarikuri', 'Yukuma'],
        female: ['Abari', 'Akuriyo', 'Amana', 'Apina', 'Bibi', 'Duna', 'Kariti', 'Kurina', 'Maima', 'Naira', 'Pakara', 'Pasiba', 'Peneri', 'Sibiri', 'Tarina', 'Tibiri', 'Wamari', 'Wanadi', 'Yarawa', 'Yukuna'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === SWAHILI COAST ===
    SWAHILI: {
        male: ['Musa', 'Ali', 'Hassan', 'Omar', 'Yusuf', 'Ibrahim', 'Hamza', 'Juma', 'Salim', 'Bakari', 'Hamisi', 'Sefu', 'Zuberi', 'Jabari', 'Rashidi', 'Faraji', 'Daudi', 'Amani', 'Baraka', 'Kipenda'],
        female: ['Fatima', 'Aisha', 'Zainab', 'Maryam', 'Halima', 'Khadija', 'Amina', 'Safia', 'Rukia', 'Salma', 'Jamila', 'Asha', 'Dalila', 'Hasina', 'Layla', 'Naima', 'Penda', 'Shani', 'Tatu', 'Zawadi'],
        surname: ['bin Said', 'al-Shirazi', 'al-Kilwa', 'bin Hassan', 'al-Mogadishu', 'bin Omar', 'al-Barawi', 'bin Yusuf', 'al-Pemba', 'bin Ali', 'al-Lamu', 'bin Rashid', 'al-Mombasa', 'bin Hamza', 'al-Zanzibar', 'bin Salim', 'al-Pate', 'bin Juma', 'al-Malindi', 'bin Bakari']
    },
    
    // === EXPANDED MIDDLE EASTERN & NORTH AFRICAN ===
    MESOPOTAMIAN_ANCIENT: {
        male: ['Sargon', 'Hammurabi', 'Nebuchadnezzar', 'Ashurbanipal', 'Tiglath', 'Shalmaneser', 'Esarhaddon', 'Sennacherib', 'Marduk', 'Enlil', 'Shamash', 'Nabu', 'Nergal', 'Ninurta', 'Adad', 'Gilgamesh', 'Enkidu', 'Utnapishtim', 'Ziusudra', 'Atrahasis'],
        female: ['Inanna', 'Ishtar', 'Ereshkigal', 'Ninlil', 'Ninhursag', 'Gula', 'Nisaba', 'Nammu', 'Nanshe', 'Bau', 'Nintud', 'Ninisina', 'Ninkarrak', 'Ninegal', 'Ningal', 'Aya', 'Antu', 'Damkina', 'Shala', 'Tashmetu'],
        surname: ['of Babylon', 'of Ur', 'of Uruk', 'of Nineveh', 'of Assur', 'of Akkad', 'of Sumer', 'of Eridu', 'of Nippur', 'of Lagash']
    },
    LEVANTINE: {
        male: ['Yusuf', 'Ibrahim', 'Khalil', 'Samir', 'Nabil', 'Faris', 'Tariq', 'Rami', 'Bassam', 'Elias', 'Boutros', 'Maroun', 'Charbel', 'Elie', 'Sami', 'Karim'],
        female: ['Layla', 'Amal', 'Hana', 'Rima', 'Nour', 'Dalia', 'Yasmine', 'Lina', 'Maya', 'Nadine', 'Rita'],
        surname: ['Haddad', 'Khoury', 'Saliba', 'Habib', 'Nassar', 'Bishara', 'Sabbagh', 'Mansour', 'Awad', 'Daoud', 'Issa', 'Hadid', 'Najjar', 'Kassis', 'Maalouf', 'Gemayel', 'Aoun', 'Hariri', 'Jumblatt', 'Frangieh']
    },
    MAGHREBI: {
        male: ['Yacine', 'Amine', 'Mehdi', 'Reda', 'Kamel', 'Farid', 'Sofiane', 'Hakim', 'Mourad', 'Djamel', 'Rachid', 'Mustapha', 'Abdel', 'Noureddine', 'Azzedine', 'Brahim', 'Slimane', 'Mansour', 'Tahar', 'Malik'],
        female: ['Amina', 'Houria', 'Djamila', 'Souad', 'Naima', 'Karima', 'Samira', 'Farida', 'Zohra', 'Hakima', 'Malika', 'Safia', 'Assia', 'Radia', 'Lynda', 'Soraya', 'Nesrine', 'Imane', 'Sabrina', 'Meriem'],
        surname: ['Benali', 'Boumediene', 'Belkacem', 'Bensaid', 'Ouahabi', 'Zerhouni', 'Bouteflika', 'Bendjelloul', 'Brahimi', 'Mekhloufi', 'Madani', 'Zidane', 'Benzema', 'Mahrez', 'Benatia', 'Slimani', 'Feghouli', 'Boudebouz', 'Belhadj', 'Ramdane']
    },
    EGYPTIAN_COPTIC: {
        male: ['Shenouda', 'Kyrillos', 'Antonios', 'Bishoy', 'Mina', 'Abraam', 'Pishoy', 'Tadros', 'Girgis', 'Mikhail', 'Boulos', 'Markos', 'Philopateer', 'Abanob', 'Karas', 'Roweis', 'Salib', 'Youssef', 'Daoud', 'Moussa'],
        female: ['Marina', 'Demiana', 'Mariam', 'Susanna', 'Verena', 'Barbara', 'Catherine', 'Rebecca', 'Sarah', 'Theodora', 'Helena', 'Monica', 'Mary', 'Martha', 'Juliana', 'Anastasia', 'Philomena', 'Agatha', 'Agnes', 'Cecilia'],
        surname: ['Tadros', 'Girgis', 'Mikhail', 'Habib', 'Salib', 'Boutros', 'Youssef', 'Daoud', 'Moussa', 'Elias', 'Hanna', 'Abdelmassih', 'Abdelmalak', 'Abdelshahid', 'Ghobrial', 'Shenouda', 'Basilios', 'Kyrillos', 'Athanasius', 'Gregorios']
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
    
    // === EXPANDED AFRICAN REGIONS ===
    ETHIOPIAN_HIGHLAND: {
        male: ['Tewodros', 'Yohannes', 'Menelik', 'Haile', 'Ras', 'Tekle', 'Zewde', 'Abebe', 'Bekele', 'Tadesse', 'Alemayehu', 'Getachew', 'Mulugeta', 'Kebede', 'Tesfaye', 'Hailu', 'Gebre', 'Wolde', 'Selassie', 'Mariam'],
        female: ['Taytu', 'Zewditu', 'Menen', 'Seble', 'Almaz', 'Tigist', 'Meseret', 'Aster', 'Bethlehem', 'Marta', 'Rahel', 'Sara', 'Liya', 'Hanna', 'Mariam', 'Kidist', 'Tsehay', 'Workitu', 'Yeshi', 'Zenebech'],
        surname: ['Wolde', 'Haile', 'Gebre', 'Tekle', 'Tsegaye', 'Alemu', 'Kebede', 'Tadesse', 'Getachew', 'Bekele']
    },
    WEST_AFRICAN_SAHEL: {
        male: ['Sundiata', 'Mansa', 'Kankan', 'Samori', 'Askia', 'Sonni', 'Bakary', 'Mamadou', 'Sekou', 'Modibo', 'Amadou', 'Moussa', 'Boubacar', 'Salif', 'Ousmane', 'Idrissa', 'Lansana', 'Foday', 'Sidi', 'Tierno'],
        female: ['Sogolon', 'Sassouma', 'Nana', 'Aminata', 'Fatoumata', 'Kadiatou', 'Mariam', 'Aissata', 'Rokia', 'Djenne', 'Oumou', 'Sira', 'Tenin', 'Fanta', 'Kankou', 'Djeneba', 'Ramata', 'Saran', 'Bintou', 'Maimouna'],
        surname: ['Keita', 'Toure', 'Traore', 'Kone', 'Diallo', 'Coulibaly', 'Cisse', 'Diarra', 'Camara', 'Sangare']
    },
    YORUBA: {
        male: ['Ogun', 'Shango', 'Obatala', 'Orunmila', 'Eshu', 'Ade', 'Babatunde', 'Oluwaseun', 'Ayodeji', 'Olumide', 'Temitope', 'Oluwafemi', 'Adebayo', 'Oluwaseyi', 'Oluwatobi', 'Adewale', 'Oladipo', 'Olukayode', 'Oluwatosin', 'Adedayo'],
        female: ['Yemoja', 'Oshun', 'Oya', 'Ayomide', 'Folake', 'Olufunke', 'Adunni', 'Ayodele', 'Bolanle', 'Damilola', 'Ebunoluwa', 'Funmilayo', 'Iyabo', 'Jumoke', 'Kemi', 'Lola', 'Mojisola', 'Ngozi', 'Omolara', 'Titilayo'],
        surname: ['Adeyemi', 'Ogundimu', 'Babajide', 'Oladele', 'Akintola', 'Ogunsanwo', 'Adebisi', 'Ogunleye', 'Adesanya', 'Olowu']
    },
    // === NUBIAN ===
    NUBIAN: {
        male: ['Taharqa', 'Piye', 'Shabaka', 'Shebitku', 'Tantamani', 'Kashta', 'Alara', 'Anlamani', 'Aspelta', 'Arikamani', 'Arkamani', 'Amanislo', 'Amanineteyerike', 'Teqorideamani', 'Nastasen', 'Harsiotef', 'Amannote', 'Baskakeren', 'Malewiebamani', 'Talakhamani'],
        female: ['Amenirdis', 'Shepenupet', 'Karimala', 'Peksater', 'Khensa', 'Abar', 'Qalhata', 'Takahatenamun', 'Naparaye', 'Sakhmakh', 'Nasalsa', 'Madiqen', 'Amanishakheto', 'Amanitore', 'Amanirenas', 'Shanakdakhete', 'Nawidemak', 'Maleqorobar', 'Amanikhatashan', 'Amanikhabale'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === EXPANDED PERSIAN & CENTRAL ASIAN ===
    PERSIAN_ANCIENT: {
        male: ['Cyrus', 'Darius', 'Xerxes', 'Artaxerxes', 'Cambyses', 'Bardiya', 'Hystaspes', 'Gobryas', 'Otanes', 'Megabazus', 'Mardonius', 'Tissaphernes', 'Pharnabazus', 'Datames', 'Mithridates', 'Tiridates', 'Phraates', 'Orodes', 'Vologases', 'Pacorus'],
        female: ['Atossa', 'Amestris', 'Mandane', 'Cassandane', 'Roxana', 'Stateira', 'Parysatis', 'Amytis', 'Pantea', 'Artemisia', 'Rhodogune', 'Apama', 'Laodice', 'Berenice', 'Cleopatra', 'Eurydice', 'Olympias', 'Thessalonica', 'Arsinoe', 'Stratonice'],
        surname: ['Achaemenid', 'Arsacid', 'Sassanid', 'of Persepolis', 'of Ecbatana', 'of Susa', 'of Pasargadae', 'of Ctesiphon', 'of Isfahan', 'of Shiraz']
    },
    SOGDIAN: {
        male: ['Divashtich', 'Gurak', 'Tarkhun', 'Karzang', 'Nanai', 'Vakhshuvar', 'Dhuta', 'Nixumat', 'Afrasiab', 'Rustam', 'Bahram', 'Jamshid', 'Farhad', 'Koshvad', 'Mihran', 'Spandiyar', 'Goshtasp', 'Zarathushtra', 'Vishtaspa', 'Jamasp'],
        female: ['Azarmidokht', 'Purandokht', 'Shirin', 'Golnar', 'Parichehr', 'Shahrzad', 'Gordafarid', 'Rudabeh', 'Tahmineh', 'Manijeh', 'Sudabeh', 'Roudabeh', 'Katayoun', 'Farangis', 'Jarireh', 'Sindokht', 'Arnavaz', 'Shahrnaz', 'Spandaramet', 'Humay'],
        surname: ['of Samarkand', 'of Bukhara', 'of Khiva', 'of Merv', 'of Balkh', 'of Kashgar', 'of Khotan', 'of Turfan', 'of Ferghana', 'of Chach']
    },
    TURKIC_STEPPE: {
        male: ['Alp', 'Arslan', 'Tugrul', 'Chaghri', 'Sanjar', 'Mahmud', 'Masud', 'Ibrahim', 'Seljuk', 'Danishmend', 'Mengucek', 'Saltuk', 'Artuk', 'Zengi', 'Nur', 'Belek', 'Timur', 'Bayezid', 'Orhan', 'Osman'],
        female: ['Altun', 'Terken', 'Gevher', 'Melike', 'Hatun', 'Bibi', 'Sati', 'Padishah', 'Khatun', 'Begum', 'Guzel', 'Ayse', 'Fatma', 'Emine', 'Turkan', 'Zubeyde', 'Mihrimah', 'Hurrem', 'Safiye', 'Kosem'],
        surname: ['Beg', 'Khan', 'Tegin', 'Yabgu', 'Shad', 'Elteber', 'Tarkan', 'Baghatur', 'Boyla', 'Tudun']
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
    
    // === IMPROVED NATIVE AMERICAN NAMES WITH REGIONAL SPECIFICITY ===
    // Pacific Northwest Coast
    PACIFIC_NORTHWEST_COAST: {
        male: ['Ksan', 'Haida', 'Tlingit', 'Kwakwaka', 'Tsimshian', 'Nootka', 'Makah', 'Quinault', 'Quileute', 'Skokomish', 'Snoqualmie', 'Duwamish', 'Suquamish', 'Muckleshoot', 'Puyallup', 'Nisqually', 'Cowlitz', 'Chinook', 'Tillamook', 'Siletz'],
        female: ['Salish', 'Skagit', 'Lummi', 'Samish', 'Swinomish', 'Tulalip', 'Snohomish', 'Stillaguamish', 'Sauk', 'Skykomish', 'Klallam', 'Queets', 'Hoh', 'Ozette', 'Neah', 'Taholah', 'Moclips', 'Copalis', 'Humptulips', 'Wynoochee'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    // California
    CALIFORNIA_NATIVE: {
        male: ['Ishi', 'Yahi', 'Yana', 'Wintu', 'Maidu', 'Miwok', 'Yokuts', 'Pomo', 'Wappo', 'Ohlone', 'Esselen', 'Salinan', 'Chumash', 'Tataviam', 'Tongva', 'Luiseño', 'Cahuilla', 'Serrano', 'Chemehuevi', 'Mojave'],
        female: ['Achomawi', 'Atsugewi', 'Modoc', 'Shasta', 'Karuk', 'Yurok', 'Hupa', 'Tolowa', 'Wiyot', 'Mattole', 'Nongatl', 'Sinkyone', 'Cahto', 'Yuki', 'Patwin', 'Konkow', 'Nisenan', 'Washoe', 'Mono', 'Paiute'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    // Great Basin
    GREAT_BASIN_NATIVE: {
        male: ['Shoshone', 'Bannock', 'Paiute', 'Ute', 'Goshute', 'Washoe', 'Numaga', 'Winnemucca', 'Ouray', 'Walkara', 'Pocatello', 'Washakie', 'Tendoy', 'Tahgee', 'Nampa', 'Weiser', 'Bruneau', 'Owyhee', 'Humboldt', 'Reese'],
        female: ['Sacajawea', 'Porivo', 'Emma', 'Cameahwait', 'Bazil', 'Tourtotte', 'Wadze', 'Wadzewipe', 'Poivier', 'Bourdeau', 'Charbonneau', 'Tabeau', 'Dorion', 'Drouillard', 'Colter', 'Potts', 'Weiser', 'Stuart', 'McKenzie', 'Ogden'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    // Southwest (improved Pueblo)
    SOUTHWEST_NATIVE: {
        male: ['Kokopelli', 'Masauwu', 'Tawa', 'Sotuknang', 'Poqanghoya', 'Palongawhoya', 'Muingwa', 'Eototo', 'Aholi', 'Angwusnasomtaka', 'Chowilawu', 'Kwataka', 'Toho', 'Tuwaletstiwa', 'Lomahongyoma', 'Yukiuma', 'Lololoma', 'Tawaquaptewa', 'Sekaquaptewa', 'Honanie'],
        female: ['Kokyangwuti', 'Hahay', 'Wuhti', 'Tuwapongtumsi', 'Qoqlo', 'Angwushahai', 'Hahai', 'Wupamo', 'Palasowitti', 'Qoqole', 'Sakwap', 'Mana', 'Tihu', 'Poli', 'Senom', 'Tukwinong', 'Hano', 'Sikyatki', 'Awatovi', 'Kawaika'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
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
    
    // === NORTH AMERICAN CULTURES ===
    MISSISSIPPIAN: {
        male: ['Tuscaloosa', 'Tuskaloosa', 'Cofitachequi', 'Pacaha', 'Casqui', 'Coosa', 'Ocute', 'Altamaha', 'Ocmulgee', 'Etowah', 'Nikwasi', 'Kituwah', 'Talomeco', 'Olamico', 'Quizquiz', 'Aquixo', 'Guachoya', 'Anilco', 'Tula', 'Tanico'],
        female: ['Coosa', 'Talisi', 'Selu', 'Ama', 'Atsila', 'Gola', 'Inola', 'Nanye', 'Salali', 'Tayanita', 'Tsula', 'Woya', 'Yona', 'Awenasa', 'Galilahi', 'Hiawassee', 'Kamama', 'Leotie', 'Nadie', 'Ocoee'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    PACIFIC_NORTHWEST: {
        male: ['Kwakwaka', 'Haida', 'Tlingit', 'Tsimshian', 'Nootka', 'Salish', 'Chinook', 'Tillamook', 'Kalapuya', 'Siletz', 'Klamath', 'Modoc', 'Wiyot', 'Yurok', 'Karuk', 'Hupa', 'Tolowa', 'Coos', 'Umpqua', 'Siuslaw'],
        female: ['Kaliska', 'Kiona', 'Leotie', 'Lomasi', 'Mahala', 'Minaku', 'Nahimana', 'Odina', 'Pelipa', 'Sahalie', 'Shasta', 'Tallulah', 'Wakanda', 'Winema', 'Yamka', 'Zaltana', 'Adsila', 'Bena', 'Chepi', 'Doli'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    CALIFORNIA_NATIVE: {
        male: ['Ishi', 'Sequoyah', 'Miwok', 'Pomo', 'Ohlone', 'Chumash', 'Yokuts', 'Maidu', 'Wintu', 'Modoc', 'Achomawi', 'Atsugewi', 'Shasta', 'Karuk', 'Yurok', 'Wiyot', 'Tolowa', 'Hupa', 'Cahuilla', 'Serrano'],
        female: ['Aiyana', 'Alameda', 'Huyana', 'Kimi', 'Litonya', 'Luyu', 'Migina', 'Nita', 'Olathe', 'Poloma', 'Sahale', 'Talasi', 'Tiva', 'Topanga', 'Uma', 'Wachiwi', 'Yoomee', 'Zaltana', 'Aponi', 'Bly'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === SOUTH AMERICAN CULTURES ===
    INCA: {
        male: ['Inti', 'Manco', 'Tupac', 'Huascar', 'Atahualpa', 'Pachacuti', 'Viracocha', 'Ayar', 'Sinchi', 'Capac', 'Quispe', 'Yupanqui', 'Amaru', 'Condor', 'Puma', 'Waman', 'Kuntur', 'Qori', 'Rumi', 'Sami'],
        female: ['Mama', 'Coya', 'Ñusta', 'Palla', 'Quilla', 'Killa', 'Chaska', 'Illapa', 'Mayu', 'Qoyllur', 'Sisa', 'Tika', 'Wara', 'Yma', 'Sumaq', 'Munay', 'Nayra', 'Pallay', 'Qara', 'Rimay'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    TUPI: {
        male: ['Peri', 'Caubi', 'Guaraci', 'Jaci', 'Tupã', 'Anhangá', 'Curupira', 'Iara', 'Boitatá', 'Saci', 'Caipora', 'Ubirajara', 'Iberê', 'Itiberê', 'Piatã', 'Raoni', 'Ubiratan', 'Cauã', 'Kaique', 'Murilo'],
        female: ['Iracema', 'Jandira', 'Jurema', 'Taina', 'Yara', 'Araci', 'Janaina', 'Moema', 'Potira', 'Iara', 'Jacira', 'Mara', 'Nina', 'Raissa', 'Samara', 'Thaynara', 'Uira', 'Vitoria', 'Xavante', 'Yasmin'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    MUISCA: {
        male: ['Bacatá', 'Zipa', 'Zaque', 'Tisquesusa', 'Nemequene', 'Quemuenchatocha', 'Aquiminzaque', 'Hunzahúa', 'Thomagata', 'Fomagata', 'Idacansas', 'Bochica', 'Chiminigagua', 'Chibchacum', 'Saguamanchica', 'Meicuchuca', 'Tutazua', 'Sugamuxi', 'Tundama', 'Saymoso'],
        female: ['Bachué', 'Huitaca', 'Chía', 'Furatena', 'Uaia', 'Faravita', 'Gualcalá', 'Ata', 'Bague', 'Caga', 'Fucha', 'Gaia', 'Ie', 'Muyquyta', 'Oba', 'Paba', 'Quica', 'Suba', 'Tiba', 'Usa'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    MAPUCHE: {
        male: ['Lautaro', 'Caupolicán', 'Colocolo', 'Galvarino', 'Leftrarü', 'Pelantaro', 'Lientur', 'Quilapán', 'Nahuel', 'Huenul', 'Curiche', 'Millal', 'Rayen', 'Newen', 'Antü', 'Kalfu', 'Kurü', 'Lafken', 'Likan', 'Meli'],
        female: ['Millaray', 'Sayen', 'Ayelen', 'Rayen', 'Amaru', 'Ayelén', 'Inara', 'Inti', 'Mailen', 'Nahiara', 'Paloma', 'Quillén', 'Rayén', 'Suyai', 'Tahiel', 'Uyara', 'Waikura', 'Xaviera', 'Yaima', 'Zulema'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
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
    // Ancient Celtic (800 BCE - 400 CE)
    CELTIC_ANCIENT: {
        male: ['Vercingetorix', 'Ambiorix', 'Indutiomarus', 'Cavarinus', 'Commius', 'Dumnorix', 'Diviciacus', 'Orgetorix', 'Cingetorix', 'Cavarillus', 'Lugotorix', 'Celtillus', 'Gobannitio', 'Convictolitavis', 'Litaviccus', 'Eporedorix', 'Viridomarus', 'Aneroestes', 'Bolgios', 'Brennos'],
        female: ['Boudica', 'Cartimandua', 'Onomaris', 'Chiomara', 'Camma', 'Eponina', 'Veleda', 'Medb', 'Scathach', 'Aife', 'Brigantia', 'Andraste', 'Sulis', 'Coventina', 'Rosmerta', 'Epona', 'Macha', 'Badb', 'Nemain', 'Morrigan'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
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
    // Ancient Korean names (Three Kingdoms period: 57 BCE - 668 CE)
    KOREAN_ANCIENT: {
        male: ['Geoseogan', 'Yuri', 'Ilseong', 'Adalla', 'Beolhyu', 'Naehae', 'Jobun', 'Cheomhae', 'Michu', 'Yurye', 'Girim', 'Heulhae', 'Sinmu', 'Naemul', 'Silseong', 'Nulji', 'Jabi', 'Soji', 'Maripgan', 'Beopheung', 'Jinheung', 'Jinji', 'Jinpyeong', 'Seondeok', 'Jindeok'],
        female: ['Seondeok', 'Jindeok', 'Jinseong', 'Aro', 'Wonhwa', 'Mishil', 'Mojiak', 'Banya', 'Deokmyeong', 'Cheonmyeong', 'Bohwa', 'Seungman', 'Jiso', 'Munhui', 'Oji', 'Seolhwa', 'Yeonhwa', 'Sohwa', 'Hwangok', 'Wolmyeong'],
        surname: ['Gim', 'Seok', 'Bak', 'Go', 'Buyeo', 'Hae', 'Gyeru', 'So', 'Yeon', 'Myeong', 'Jin', 'Wang', 'Yu', 'Gwon', 'Choe']
    },
    KOREAN: {
        male: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ha-jun', 'Eun-woo', 'Si-woo', 'Jun-seo', 'Ye-jun', 'Ji-ho', 'In-ho', 'Seung-woo', 'Hyun-woo', 'Jin-woo', 'Tae-hyun', 'Dong-hyun', 'Woo-jin', 'Chan-ho', 'Jae-min', 'Kyung-ho', 'Sang-ho', 'Young-soo', 'Min-ho', 'Joon-ho', 'Sung-min', 'Chang-ho', 'Kwang-soo', 'Hyung-min', 'Dae-hyun', 'Jun-ho', 'Seok-jin'],
        female: ['Ji-hye', 'Seo-yeon', 'Ha-eun', 'Ji-woo', 'Min-seo', 'So-yeon', 'Yoo-jin', 'Chae-won', 'Ga-eun', 'Ye-eun', 'Su-bin', 'Yu-na', 'Hye-jin', 'Eun-ji', 'Da-eun', 'Na-eun', 'Soo-jin', 'Min-ji', 'Ye-jin', 'Hyo-jin', 'Bo-ram', 'Hae-won', 'Ji-min', 'Seo-hyun', 'Yeon-seo', 'Ah-young', 'So-young', 'Hye-won', 'Jin-ah', 'Mi-young'],
        surname: ['Kim', 'Lee', 'Park', 'Choi', 'Jeong', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong', 'Jeon', 'Go', 'Moon', 'Yang', 'Baek', 'Heo', 'Nam', 'Shim', 'Ryu', 'Min']
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
        surname: []
    },

    // === PHASE 1 HIGH-IMPACT REGIONAL ADDITIONS ===

    // Venetian Republic (9th-18th century) - Major Mediterranean trade power
    VENETIAN_MEDIEVAL: {
        male: ['Marco', 'Andrea', 'Francesco', 'Giovanni', 'Nicolò', 'Pietro', 'Alvise', 'Giacomo', 'Domenico', 'Lorenzo', 'Sebastiano', 'Antonio', 'Bernardo', 'Matteo', 'Zuane', 'Marin', 'Zorzi', 'Luca', 'Michiel', 'Piero', 'Alvise', 'Cristoforo', 'Bartolomeo', 'Hieronimo', 'Tomaso', 'Vicenzo', 'Zaccaria', 'Benedetto', 'Stefano', 'Agostino'],
        female: ['Caterina', 'Elena', 'Lucrezia', 'Bianca', 'Francesca', 'Elisabetta', 'Marietta', 'Andriana', 'Chiara', 'Paola', 'Violante', 'Cornelia', 'Modesta', 'Isabetta', 'Anzola', 'Diamante', 'Orsa', 'Costanza', 'Cassandra', 'Laura', 'Marina', 'Cecilia', 'Maddalena', 'Agnesina', 'Zanetta', 'Betta', 'Faustina', 'Helisabetta', 'Margarita', 'Veronica'],
        surname: ['Mocenigo', 'Contarini', 'Dandolo', 'Foscari', 'Gritti', 'Loredan', 'Morosini', 'Pesaro', 'Querini', 'Sagredo', 'Sanudo', 'Soranzo', 'Tron', 'Vendramin', 'Venier', 'Zeno', 'Barbarigo', 'Bembo', 'Bernardo', 'Bragadin', 'Cappello', 'Corner', 'Dolfin', 'Emo', 'Falier', 'Giustinian', 'Grimani', 'Malipiero', 'Marcello', 'Pisani']
    },

    // Moorish Al-Andalus (711-1492 CE) - Islamic Iberia
    MOORISH_ANDALUS: {
        male: ['Abd al-Rahman', 'Muhammad', 'Ahmad', 'Ali', 'Yusuf', 'Ibrahim', 'Ismail', 'Hakim', 'Tariq', 'Musa', 'Umar', 'Hasan', 'Abd Allah', 'Sulayman', 'Yahya', 'Idris', 'Marwan', 'Qasim', 'Rashid', 'Salim', 'Zakariya', 'Mansur', 'Nasr', 'Abd al-Malik', 'Hisham', 'Walid', 'Abd al-Aziz', 'Habib', 'Khalid', 'Sa\'id'],
        female: ['Fatima', 'Aisha', 'Khadija', 'Zaynab', 'Mariam', 'Safiyya', 'Umm Kulthum', 'Ruqayya', 'Hafsa', 'Sawda', 'Maymuna', 'Zahra', 'Wallada', 'Muhja', 'Nazhun', 'Umm al-Hana', 'Lubna', 'Radi\'a', 'Shuhda', 'Qamar', 'Thuraya', 'Buthayna', 'Hind', 'Layla', 'Su\'ad', 'Aminah', 'Asma', 'Salma', 'Umayma', 'Widad'],
        surname: ['al-Andalusi', 'al-Qurtubi', 'al-Ishbili', 'al-Gharnati', 'al-Balansiy', 'al-Tulaytuli', 'ibn Rushd', 'ibn Sina', 'ibn Hazm', 'ibn Arabi', 'al-Zarqali', 'ibn Bajja', 'ibn Tufayl', 'al-Idrisi', 'ibn Quzman', 'al-Shushtari', 'ibn Malik', 'al-Rundi', 'ibn Abbad', 'al-Lakhmi', 'ibn Masarra', 'al-Majriti', 'ibn al-Khatib', 'al-Shaqundi', 'ibn Firnas', 'al-Himyari', 'ibn Zuhr', 'al-Bitruji', 'ibn Baqi', 'al-Mursi']
    },

    // Byzantine Empire (330-1453 CE) - Eastern Roman continuation
    BYZANTINE_GREEK: {
        male: ['Konstantinos', 'Ioannes', 'Mikhael', 'Basileios', 'Theodoros', 'Nikephoros', 'Alexios', 'Isaakios', 'Stephanos', 'Georgios', 'Demetrios', 'Nikolas', 'Anastasios', 'Prokopios', 'Maximos', 'Leon', 'Romanos', 'Photios', 'Ignatios', 'Athanasios', 'Chrysostomos', 'Methodios', 'Kyrillos', 'Dionysios', 'Euthymios', 'Kallinikos', 'Leontios', 'Markianos', 'Nikandros', 'Philotheos'],
        female: ['Anna', 'Maria', 'Theodora', 'Irene', 'Eudokia', 'Zoe', 'Konstantina', 'Aikaterine', 'Euphemia', 'Helena', 'Sophia', 'Anastasia', 'Barbara', 'Kyriaki', 'Paraskevi', 'Agatha', 'Evdokia', 'Thomais', 'Xene', 'Kalomaria', 'Pelagia', 'Theodosia', 'Chryse', 'Eugenia', 'Gregoria', 'Ioanna', 'Kale', 'Magdalene', 'Nektaria', 'Olympia'],
        surname: ['Paleologos', 'Komnenos', 'Doukas', 'Kantakouzenos', 'Laskaris', 'Angelos', 'Botaneiates', 'Dalassenos', 'Skleros', 'Phokas', 'Argyros', 'Kourkouas', 'Tzykandyles', 'Tornikios', 'Bryennios', 'Diogenes', 'Botaneiates', 'Maleinos', 'Xiphias', 'Bourtzes', 'Kamytzes', 'Melissenos', 'Nikephoros', 'Palaiologina', 'Raoul', 'Synadenos', 'Tarchaneiotes', 'Vatatztes', 'Xeros', 'Zarides']
    },

    // Khmer Empire/Angkor Period (802-1431 CE) - Southeast Asian temple civilization
    KHMER_ANGKOR: {
        male: ['Jayavarman', 'Suryavarman', 'Indravarman', 'Udayadityavarman', 'Harshavarman', 'Rajendravarman', 'Yashovarman', 'Tribhuvanadityavarman', 'Preah Ket Mealea', 'Nirvanapada', 'Kavindrarimathana', 'Jaya Indravarman', 'Srindravarman', 'Dharanindravarman', 'Paramavishnuloka', 'Kambu', 'Preah Thong', 'Kaundinya', 'Rudravarman', 'Bhavavarman', 'Mahendravarman', 'Isanavarman', 'Pushkaraksha', 'Sambhuvarman', 'Jayadevi', 'Chitrasena', 'Mahendraparvata', 'Aninditapura', 'Banteay Prei', 'Srei Santhor'],
        female: ['Jayarajadevi', 'Indradevi', 'Kulaprabhavatikalai', 'Rajacudamani', 'Jayarajacudamani', 'Tribhuvaneshvari', 'Parameshvaralakshmi', 'Chudamani', 'Aparajita', 'Lakshmindralakshmi', 'Vijayalakshmi', 'Kamalesvaridevi', 'Ripusuddhi', 'Kambu', 'Mera', 'Soma', 'Neang Neak', 'Willow', 'Peou', 'Pich', 'Sophea', 'Chenda', 'Devi', 'Kanya', 'Lavea', 'Molica', 'Pisey', 'Rachana', 'Socheat', 'Tevy'],
        surname: ['(No Surname)', 'of Angkor', 'of Yashodharapura', 'of Hariharalaya', 'of Roluos', 'of Banteay Srei', 'of Preah Vihear', 'of Koh Ker', 'of Baphuon', 'of Bayon', 'of Ta Prohm', 'of Banteay Kdei', 'of Neak Pean', 'of East Mebon', 'of Pre Rup', 'of Srah Srang', 'of Phnom Bakheng', 'of Baksei Chamkrong', 'of Prasat Kravan', 'of Bat Chum']
    },

    // === PHASE 2 REGIONAL REFINEMENTS ===

    // Flemish/Low Countries (12th-16th century) - Trade networks and textile centers
    FLEMISH_MEDIEVAL: {
        male: ['Willem', 'Jan', 'Pieter', 'Hendrik', 'Jacob', 'Dirk', 'Cornelis', 'Andries', 'Thomas', 'Joris', 'Michiel', 'Philips', 'Karel', 'Lodewijk', 'Rogier', 'Hans', 'Aert', 'Claes', 'Lieven', 'Maerten', 'Wouter', 'Franchoys', 'Gillis', 'Joos', 'Lancelot', 'Boudewijn', 'Reinout', 'Govaert', 'Adriaen', 'Jeronimus'],
        female: ['Margaretha', 'Elisabeth', 'Catharina', 'Anna', 'Maria', 'Jacoba', 'Johanna', 'Agnes', 'Barbara', 'Clara', 'Cornelia', 'Dorothea', 'Susanna', 'Petronella', 'Apollonia', 'Beatrijs', 'Lijsbeth', 'Machteld', 'Aleydis', 'Berta', 'Gheertruid', 'Heilwich', 'Ide', 'Katelijne', 'Lievine', 'Mayken', 'Neel', 'Tanneken', 'Vrouwe', 'Ysabeau'],
        surname: ['van der Meer', 'de Vries', 'van den Berg', 'Janssen', 'de Jong', 'van Dijk', 'Bakker', 'de Groot', 'van Houten', 'Smit', 'van der Linden', 'Mulder', 'de Wit', 'van der Heijden', 'van Leeuwen', 'van der Ven', 'Dekker', 'van den Broek', 'de Boer', 'van der Steen', 'van Beek', 'Verhagen', 'van der Poel', 'de Bruijn', 'van den Heuvel', 'Vermeulen', 'van der Werf', 'de Haan', 'van der Kamp', 'Timmermans']
    },

    // Catalan Medieval (10th-15th century) - Mediterranean commercial culture
    CATALAN_MEDIEVAL: {
        male: ['Ramon', 'Berenguer', 'Pere', 'Jaume', 'Arnau', 'Guillem', 'Bernat', 'Ferran', 'Joan', 'Miquel', 'Antoni', 'Francesc', 'Bartomeu', 'Lluís', 'Galceran', 'Guerau', 'Dalmau', 'Ponç', 'Berenguer', 'Gilabert', 'Huguet', 'Jacint', 'Llorenç', 'Mateu', 'Nicolau', 'Onofre', 'Pau', 'Quintí', 'Rafael', 'Salvador'],
        female: ['Elisenda', 'Violant', 'Constança', 'Sibil·la', 'Ermessenda', 'Almodis', 'Beatriu', 'Blanca', 'Caterina', 'Dolça', 'Elionor', 'Francesca', 'Guillemona', 'Isabel', 'Joana', 'Llúcia', 'Margarida', 'Núria', 'Petronila', 'Sança', 'Teresa', 'Urraca', 'Violant', 'Agnès', 'Alamanda', 'Benvinguda', 'Clara', 'Dulcia', 'Estefania', 'Guisla'],
        surname: ['de Barcelona', 'de Montcada', 'de Cabrera', 'de Cardona', 'de Foix', 'de Pallars', 'de Urgell', 'de Empúries', 'de Cervera', 'de Montpellier', 'de Narbona', 'de Besalú', 'de Girona', 'de Tarragona', 'de Lleida', 'de Valencia', 'de Mallorca', 'de Rosselló', 'de Cerdanya', 'de Ribagorça', 'de Peralada', 'de Castellbó', 'de Luna', 'de Centelles', 'de Requesens', 'de Vilanova', 'de Pinós', 'de Rocabertí', 'de Sagarriga', 'de Sentmenat']
    },

    // Thai Ayutthaya Kingdom (1351-1767 CE) - Southeast Asian kingdom period
    THAI_AYUTTHAYA: {
        male: ['Ramathibodi', 'Borommaracha', 'Ramesuan', 'Boromarachathirat', 'Intharacha', 'Borommatrailokkanat', 'Borommarachathirat', 'Ramathibodi', 'Chairacha', 'Yotfa', 'Prasat Thong', 'Chai', 'Si', 'Narai', 'Phetracha', 'Sua', 'Thai Sa', 'Borommakot', 'Uthumphon', 'Suriyamarin', 'Ekkathat', 'Taksin', 'Somdet', 'Chao Phraya', 'Luang', 'Khun', 'Nai', 'Phra', 'Thao', 'Muen'],
        female: ['Si Suriyothai', 'Wisutkasat', 'Suriyenthrathibodi', 'Thotsarot', 'Kalyanamitra', 'Thepsutthavadi', 'Amarindra', 'Sunandha', 'Saovabha', 'Dara Rasmi', 'Mom Chao', 'Phrachao', 'Somdet Phra', 'Chao', 'Khunying', 'Mom Luang', 'Mom Rajawongse', 'Thanpuying', 'Ying', 'Nang', 'Mae', 'Khun Mae', 'Phra Mae', 'Chao Mae', 'Somdet', 'Ratana', 'Sirikit', 'Chulabhorn', 'Ubolratana', 'Sirindhorn'],
        surname: ['Na Ayutthaya', 'Na Bangkok', 'Na Lopburi', 'Na Phitsanulok', 'Na Sukhothai', 'Na Chainat', 'Na Suphanburi', 'Na Ratchaburi', 'Na Phetchaburi', 'Na Nakhon Pathom', 'Na Kanchanaburi', 'Na Prachinburi', 'Na Chachoengsao', 'Na Nonthaburi', 'Na Samut Prakan', 'Na Samut Sakhon', 'Na Samut Songkhram', 'Na Nakhon Nayok', 'Na Pathum Thani', 'Na Ang Thong', 'Na Sing Buri', 'Na Chai Nat', 'Na Uthai Thani', 'Na Kamphaeng Phet', 'Na Tak', 'Na Phichit', 'Na Phetchabun', 'Na Nakhon Sawan', 'Na Lop Buri', 'Na Sara Buri']
    },

    // Mamluk Egypt (1250-1517 CE) - Medieval Islamic Egypt specificity
    MAMLUK_EGYPT: {
        male: ['Baibars', 'Qalawun', 'Khalil', 'Nasir', 'Ashraf', 'Salih', 'Aybak', 'Shajar', 'Turanshah', 'Faraj', 'Muayyad', 'Barsbay', 'Jaqmaq', 'Inal', 'Khushqadam', 'Bilbay', 'Timurbugha', 'Qansuh', 'Tuman', 'Janbalat', 'Azbak', 'Qurqumas', 'Yashbak', 'Aqbirdi', 'Sudun', 'Taghribirdi', 'Jakam', 'Altunbugha', 'Yalbugha', 'Shaykhu'],
        female: ['Shajar al-Durr', 'Fatima', 'Aisha', 'Zaynab', 'Khadija', 'Umm Kulthum', 'Safiyya', 'Hafsa', 'Ruqayya', 'Mariam', 'Asma', 'Salma', 'Layla', 'Aminah', 'Thurayya', 'Qamar', 'Najma', 'Sahar', 'Dalal', 'Widad', 'Siham', 'Nawal', 'Fawzia', 'Nazira', 'Samira', 'Tahira', 'Zahira', 'Bashira', 'Munira', 'Sakinah'],
        surname: ['al-Misri', 'al-Qahiri', 'al-Mamluki', 'al-Bahri', 'al-Burji', 'al-Turkumani', 'al-Circassi', 'al-Rumi', 'al-Shami', 'al-Halabi', 'al-Dimashqi', 'al-Ghazzi', 'ibn Tulun', 'ibn Qalawun', 'ibn Ayyub', 'al-Nasiri', 'al-Ashraf', 'al-Zahir', 'al-Salih', 'al-Kamil', 'al-Adil', 'al-Mansur', 'al-Muzaffar', 'al-Afdal', 'ibn Mammati', 'ibn Muyassar', 'ibn Wasil', 'ibn Shaddad', 'ibn Nazif', 'al-Maqrizi']
    },

    // === SOUTH ASIAN SUB-GROUPS ===
    // === EXPANDED SOUTH ASIAN ===
    SANSKRIT_CLASSICAL: {
        male: ['Arjuna', 'Bhima', 'Yudhishthira', 'Nakula', 'Sahadeva', 'Karna', 'Duryodhana', 'Bhishma', 'Drona', 'Krishna', 'Rama', 'Lakshmana', 'Bharata', 'Shatrughna', 'Hanuman', 'Ravana', 'Vibhishana', 'Sugriva', 'Vali', 'Indrajit'],
        female: ['Draupadi', 'Kunti', 'Gandhari', 'Sita', 'Radha', 'Rukmini', 'Satyabhama', 'Subhadra', 'Mandodari', 'Urmila', 'Satyavati', 'Ambika', 'Ambalika', 'Ganga', 'Savitri', 'Shakuntala', 'Damayanti', 'Lopamudra', 'Arundhati', 'Anasuya'],
        surname: ['Pandava', 'Kaurava', 'Bharata', 'Ikshvaku', 'Raghu', 'Yadava', 'Vrishni', 'Kuru', 'Puru', 'Anu']
    },
    DRAVIDIAN: {
        male: ['Selvam', 'Murugan', 'Karthik', 'Senthil', 'Kumaran', 'Arun', 'Bala', 'Durai', 'Ganesan', 'Hari', 'Jagan', 'Kannan', 'Mani', 'Nandhan', 'Pandian', 'Rajan', 'Siva', 'Thiru', 'Velan', 'Vimal'],
        female: ['Kavitha', 'Priya', 'Lakshmi', 'Meera', 'Nithya', 'Oviya', 'Padma', 'Radha', 'Sangeetha', 'Tamil', 'Uma', 'Vani', 'Yamini', 'Anjali', 'Bhavani', 'Chitra', 'Devi', 'Geetha', 'Indira', 'Jaya'],
        surname: ['Pillai', 'Nair', 'Menon', 'Iyer', 'Iyengar', 'Nadar', 'Reddy', 'Naidu', 'Mudaliar', 'Chettiar']
    },
    RAJPUT: {
        male: ['Prithviraj', 'Rana', 'Maharana', 'Rao', 'Raja', 'Kunwar', 'Thakur', 'Rawat', 'Bhupendra', 'Chandrabhan', 'Durgadas', 'Fateh', 'Gaj', 'Hammir', 'Jai', 'Karan', 'Lakshman', 'Man', 'Narendra', 'Om'],
        female: ['Padmini', 'Padmavati', 'Mira', 'Gayatri', 'Sanyogita', 'Jaishree', 'Karnavati', 'Durgavati', 'Tarabai', 'Ahilyabai', 'Avantibai', 'Bhagwati', 'Champavati', 'Hansabai', 'Jodhabai', 'Kishori', 'Lilavati', 'Manvati', 'Narbada', 'Roopmati'],
        surname: ['Sisodia', 'Rathore', 'Chauhan', 'Parmar', 'Solanki', 'Kachwaha', 'Bundela', 'Chandela', 'Gahlot', 'Bhati']
    },
    BENGALI: {
        male: ['Rabindra', 'Debendra', 'Satyendra', 'Jogendra', 'Birendra', 'Surendra', 'Narendra', 'Upendra', 'Mahendra', 'Dhirendra', 'Subrata', 'Sourav', 'Pranab', 'Amartya', 'Buddhadeb', 'Jyoti', 'Mamata', 'Manoj', 'Tapan', 'Utpal'],
        female: ['Sharmila', 'Aparna', 'Supriya', 'Rituparna', 'Moushumi', 'Konkona', 'Raima', 'Tanushree', 'Bipasha', 'Sushmita', 'Aishwarya', 'Kajol', 'Rani', 'Jaya', 'Sharmistha', 'Ananya', 'Debalina', 'Gayatri', 'Indrani', 'Jayanti'],
        surname: ['Banerjee', 'Chatterjee', 'Mukherjee', 'Ganguly', 'Bhattacharya', 'Sen', 'Bose', 'Ghosh', 'Roy', 'Das']
    },
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
        surname: []
    },
    MELANESIAN: {
        male: ['Bani', 'Tavu', 'Kem', 'Wani', 'Nalu', 'Kila', 'Mendi', 'Vanua', 'Tiko', 'Ratu', 'Seru', 'Jone', 'Viliame', 'Epeli', 'Tomasi', 'Aisea', 'Manoa', 'Tevita', 'Salote', 'Rusiate', 'Simione', 'Peni', 'Waisea', 'Iowane', 'Mosese', 'Lasaro', 'Filipe', 'Petero', 'Apisai', 'Isikeli'],
        female: ['Salote', 'Ana', 'Mere', 'Mele', 'Litia', 'Vika', 'Sala', 'Adi', 'Bulou', 'Lavenia', 'Serena', 'Talei', 'Nanise', 'Alanieta', 'Makereta', 'Veniana', 'Arieta', 'Kelera', 'Melaia', 'Raijeli', 'Timoci', 'Vasiti', 'Akanisi', 'Salanieta', 'Laisani', 'Taraivini', 'Vulimila', 'Wainikiti', 'Salome', 'Eta'],
        surname: []
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
        surname: ['Yupanki', 'Wankár', 'Quespi', 'Kondori', 'Waman', 'Amaru', 'Choque', 'Quispe', 'Huanca', 'Mamani', 'Apaza', 'Ccopa', 'Cusipaucar', 'Hancco', 'Inca', 'Llanos', 'Marca', 'Nina', 'Pacco', 'Quiso', 'Soncco', 'Ttito', 'Waskar', 'Xerez', 'Yabar', 'Zapana', 'Alanoca']
    },
    GUARANI: {
        male: ['Arandu', 'Carai', 'Guyrá', 'Jagua', 'Karai', 'Mandu', 'Nande', 'Paraguasu', 'Ruvicha', 'Sepé', 'Tabare', 'Ubiratan', 'Yaci', 'Aimberê', 'Caetano', 'Guaraci', 'Ibiapina', 'Jaci', 'Karim', 'Moacir', 'Peri', 'Rudá', 'Tupã', 'Ubirajara', 'Abeguar', 'Boitatá', 'Cunhambebe', 'Guaraní', 'Iara', 'Jandira'],
        female: ['Iara', 'Jaci', 'Jurema', 'Maiara', 'Potira', 'Raoni', 'Tainá', 'Uiara', 'Yara', 'Aracy', 'Ceci', 'Iracema', 'Janaína', 'Moema', 'Naiá', 'Potyra', 'Rudá', 'Tainá', 'Ubiratã', 'Yacy', 'Açucena', 'Cauã', 'Guaraci', 'Iansan', 'Jandaira', 'Kauê', 'Maíra', 'Naara', 'Piraí', 'Samaúma'],
        surname: []
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
    },

    // === MADAGASCAR & INDIAN OCEAN ===
    MALAGASY_MERINA: {
        male: ['Andriamanelo', 'Ralambo', 'Andrianampoinimerina', 'Radama', 'Rakoto', 'Rainivoninahitriniony', 'Ratsimandrava', 'Rainilaiarivony', 'Ramaroson', 'Razafy', 'Ratsiraka', 'Raherimanana', 'Rajaobelina', 'Randrianasolo', 'Rasolo', 'Razafindrakoto', 'Ramanantsoa', 'Ratsimamanga', 'Rakotondrabe', 'Rakotoniaina'],
        female: ['Ranavalona', 'Rasoherina', 'Rasalimo', 'Raketaka', 'Ranoro', 'Rabodo', 'Raharimalala', 'Razanamaro', 'Raveloson', 'Razafy', 'Ratsimbazafy', 'Rasoamanarivo', 'Raharijaona', 'Razanatseheno', 'Rasendrasoa', 'Rasolofonirina', 'Ravelomanantsoa', 'Razanadrakoto', 'Ratsimbaharison', 'Rabemananjara'],
        surname: ['Andriamahefa', 'Razakandrainy', 'Ramanampisoa', 'Andrianarivelo', 'Rasamoelina', 'Razanakolona', 'Randriamampionona', 'Rabearimanana', 'Andriamampandry', 'Razafindratsima', 'Randriamahaleo', 'Rasoloniaina', 'Andriamamonjy', 'Razafimaharo', 'Randrianasolo', 'Rabekoto', 'Andriamanga', 'Razafindrakoto', 'Randrianary', 'Rasolonjatovo']
    },
    MALAGASY_BETSILEO: {
        male: ['Andriamanalina', 'Rainimaharavo', 'Ramenia', 'Rabetsara', 'Andrianony', 'Rafaralahy', 'Rabeandrianina', 'Razanadrakoto', 'Ramilison', 'Rainitantely', 'Rasolofoson', 'Ratsimbazafy', 'Ramaroson', 'Rabary', 'Andriamanantena', 'Rasoanaivo', 'Randriamanantena', 'Rabemananjara', 'Ratsizafy', 'Ramanampisoa'],
        female: ['Rasoanandrasana', 'Rabenanahary', 'Rasoamampianina', 'Razanadrakoto', 'Raharimanga', 'Razanamahasoa', 'Ravelomanantsoa', 'Rasolonjatovo', 'Randrianasolo', 'Rabemanantsoa', 'Razafindrakoto', 'Raharinomena', 'Rasolondraibe', 'Razanabahiny', 'Randriamanitra', 'Rabearimanana', 'Razafimaharo', 'Raveloson', 'Rasoanaivo', 'Rabary'],
        surname: ['Ramanantsoa', 'Razafindralambo', 'Andriamampandry', 'Rasolonjatovo', 'Randriamanantena', 'Rabemanantsoa', 'Razanadrakoto', 'Rabemananjara', 'Andriamanalina', 'Rasoanaivo', 'Razafindrakoto', 'Randriamanitra', 'Rabearimanana', 'Razafimaharo', 'Ravelomanantsoa', 'Rasolofoson', 'Andriamanantena', 'Rabenanahary', 'Razanamahasoa', 'Ramilison']
    },
    MALAGASY_SAKALAVA: {
        male: ['Andriandahifotsy', 'Andriamandisoarivo', 'Andriantompokoindrindra', 'Boina', 'Menabe', 'Andriamasinavalona', 'Andriambolamena', 'Andriamanelo', 'Andriantsitoha', 'Andriantsoly', 'Andriamandresy', 'Andrianampoinimerina', 'Andriantompokoindrindra', 'Andriamanalina', 'Ramaromanompo', 'Ramavo', 'Ramboasalama', 'Raminia', 'Ramonja', 'Randriana'],
        female: ['Ravahiny', 'Rafohy', 'Rangita', 'Rasoamampianina', 'Ranoro', 'Rabehaza', 'Razanakoto', 'Ravelomanantsoa', 'Rasolofoson', 'Rabetsara', 'Rasoanandrasana', 'Raharimanga', 'Rasoanaivo', 'Randrianasolo', 'Razanadrakoto', 'Rabemanantsoa', 'Rabemananjara', 'Razafindrakoto', 'Raveloson', 'Razafimaharo'],
        surname: ['Andriambolamena', 'Andriamandisoarivo', 'Andriantompokoindrindra', 'Andriamasinavalona', 'Andriandahifotsy', 'Andrianampoinimerina', 'Andriamanalina', 'Andriamandresy', 'Andriantsitoha', 'Andriantsoly', 'Ramaromanompo', 'Ramboasalama', 'Randrianasolo', 'Razanadrakoto', 'Ravelomanantsoa', 'Rabemananjara', 'Razafindrakoto', 'Rasolofoson', 'Rasoanaivo', 'Rabemanantsoa']
    },

    // === SOUTHEAST ASIAN SPECIFICS ===
    VIETNAMESE: {
        male: ['Nguyen', 'Minh', 'Duc', 'Hoang', 'Quang', 'Huy', 'Tuan', 'Dung', 'Hung', 'Nam', 'Thang', 'Long', 'Son', 'Phong', 'Truong', 'Cuong', 'Hai', 'Viet', 'Bao', 'Thanh', 'Kien', 'Tam', 'Lam', 'Khoa', 'An', 'Tien', 'Dat', 'Loc', 'Binh', 'Hieu'],
        female: ['Linh', 'Hoa', 'Mai', 'Lan', 'Huong', 'Thuy', 'Nga', 'Yen', 'Ha', 'Phuong', 'Trinh', 'Hong', 'Thu', 'Trang', 'Ly', 'Kim', 'Hang', 'Van', 'Duyen', 'Hien', 'Nhung', 'Tuyet', 'Dieu', 'Quynh', 'Chau', 'Thao', 'Anh', 'My', 'Ngoc', 'Xuan'],
        surname: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly', 'Thai', 'Trinh', 'Dinh', 'Cao', 'Ta', 'Lam', 'Luong', 'Truong', 'Doan', 'Huynh', 'Mai', 'Vo', 'Bach', 'Tong', 'Lac', 'Phung']
    },
    THAI: {
        male: ['Somchai', 'Somsak', 'Surachai', 'Wichai', 'Prasit', 'Narong', 'Sombat', 'Suchart', 'Surin', 'Thanet', 'Wiwat', 'Amnuay', 'Kamon', 'Preecha', 'Chaiwat', 'Bandit', 'Manit', 'Chusak', 'Pichet', 'Pornsak', 'Kamron', 'Boonmee', 'Niran', 'Thawat', 'Kriengsak', 'Bundit', 'Prasert', 'Thana', 'Worawit', 'Sathit'],
        female: ['Siriporn', 'Malee', 'Suda', 'Wannee', 'Pranee', 'Ratana', 'Pensri', 'Niran', 'Duangjai', 'Somjit', 'Wassana', 'Anchalee', 'Benjawan', 'Chanida', 'Duangporn', 'Janya', 'Kannika', 'Ladda', 'Maneerat', 'Naree', 'Oraphin', 'Piyanut', 'Ratchanee', 'Siriwan', 'Tipawan', 'Uraiwan', 'Wanida', 'Yupa', 'Amporn', 'Boonsri'],
        surname: ['Srisawat', 'Charoensuk', 'Wongsuwan', 'Thanakit', 'Piyapan', 'Siriporn', 'Kamolpan', 'Ratanachai', 'Prasertporn', 'Wichayaporn', 'Chinawong', 'Suksamran', 'Theerawat', 'Vorachote', 'Charoenrat', 'Amnuayporn', 'Boonchana', 'Sirichai', 'Thanapon', 'Wanichkorn', 'Chalermporn', 'Duangrat', 'Keeratiporn', 'Naruepon', 'Prasertsuk', 'Ratchanee', 'Somchaiporn', 'Thawatchai', 'Wachiraporn', 'Yingyong']
    },
    BURMESE: {
        male: ['Thant', 'Tin', 'Than', 'Htun', 'Win', 'Khin', 'Mya', 'Soe', 'Zaw', 'Htin', 'Kyaw', 'Aung', 'Thet', 'Ye', 'Ko', 'Min', 'Nyi', 'Oo', 'Phyo', 'Pyae', 'Set', 'Thu', 'Wai', 'Yan', 'Zin', 'Kaung', 'Naing', 'Paing', 'Thura', 'Wunna'],
        female: ['Khin', 'Mya', 'Tin', 'Thant', 'Win', 'Aye', 'Hla', 'May', 'Nwe', 'San', 'Swe', 'Htay', 'Kyi', 'Mar', 'Nan', 'Nu', 'Pwint', 'Su', 'Thandar', 'Yi', 'Cho', 'Ei', 'Htet', 'Kay', 'Lwin', 'Myat', 'Nilar', 'Phyu', 'Sandar', 'Wah'],
        surname: ['Maung', 'Kyaw', 'Aung', 'Tun', 'Hlaing', 'Oo', 'Thant', 'Win', 'Than', 'Htun', 'Soe', 'Zaw', 'Mya', 'Khin', 'Tin', 'Ye', 'Min', 'Thu', 'Naing', 'Wai', 'Zin', 'Htay', 'Lwin', 'Nyi', 'Phyo', 'Set', 'Thura', 'Wunna', 'Yan', 'Kaung']
    },
    KHMER: {
        male: ['Sovann', 'Pisach', 'Chanthy', 'Rith', 'Makara', 'Vichet', 'Bunroeun', 'Dara', 'Kosal', 'Marady', 'Narith', 'Pheaktra', 'Raksa', 'Samnang', 'Thearith', 'Vanna', 'Watthana', 'Yunos', 'Bophal', 'Chamnan'],
        female: ['Chenda', 'Davi', 'Kanitha', 'Lyhour', 'Mealea', 'Neary', 'Panha', 'Ravy', 'Sophea', 'Thida', 'Veasna', 'Chantrea', 'Ratana', 'Bopha', 'Phary', 'Sreypov', 'Chamroeun', 'Kolab', 'Pichsamnang', 'Sreypich'],
        surname: ['Chea', 'Chhun', 'Heng', 'Huy', 'Keo', 'Khem', 'Kong', 'Leng', 'Ly', 'Mao', 'Nhem', 'Ouk', 'Pen', 'Ros', 'Sam', 'Seng', 'Sim', 'Sok', 'Soun', 'Touch', 'Try', 'Vann', 'Vong', 'Yim', 'Yorn', 'Chey', 'Khiev', 'Nget', 'Proeung', 'Roeun']
    },
    MALAY: {
        male: ['Ahmad', 'Abdul', 'Muhammad', 'Ali', 'Hassan', 'Ibrahim', 'Ismail', 'Omar', 'Yusof', 'Zakaria', 'Rahman', 'Salleh', 'Mahmud', 'Sulaiman', 'Rashid', 'Hamid', 'Karim', 'Rahim', 'Latif', 'Halim', 'Razak', 'Aziz', 'Nasir', 'Hakim', 'Farid', 'Nizam', 'Zain', 'Bakar', 'Azman', 'Rosli'],
        female: ['Siti', 'Fatimah', 'Aminah', 'Khadijah', 'Zainab', 'Hafsah', 'Aishah', 'Maryam', 'Halimah', 'Ruqayyah', 'Safiyyah', 'Ummu', 'Raudhah', 'Wardina', 'Nur', 'Farah', 'Sarah', 'Laila', 'Aisyah', 'Nabila', 'Salma', 'Huda', 'Iman', 'Hidayah', 'Syahirah', 'Alya', 'Syafiqah', 'Widad', 'Zara', 'Qistina'],
        surname: ['Abdullah', 'Rahman', 'Ibrahim', 'Ahmad', 'Hassan', 'Ali', 'Muhammad', 'Yusof', 'Ismail', 'Omar', 'Zakaria', 'Mahmud', 'Salleh', 'Sulaiman', 'Rashid', 'Hamid', 'Karim', 'Rahim', 'Latif', 'Halim', 'Razak', 'Aziz', 'Nasir', 'Hakim', 'Farid', 'Nizam', 'Zain', 'Bakar', 'Azman', 'Rosli']
    },
    INDONESIAN: {
        male: ['Budi', 'Agus', 'Hendra', 'Dedi', 'Eko', 'Rudi', 'Joko', 'Wahyu', 'Bambang', 'Yudi', 'Andi', 'Indra', 'Yanto', 'Hadi', 'Slamet', 'Tono', 'Dwi', 'Rizki', 'Adi', 'Bayu', 'Dimas', 'Fajar', 'Gilang', 'Heri', 'Irfan', 'Kuncoro', 'Lutfi', 'Maulana', 'Nova', 'Ozi'],
        female: ['Sri', 'Sari', 'Dewi', 'Ratna', 'Indah', 'Maya', 'Rina', 'Yuni', 'Wati', 'Lestari', 'Fitri', 'Nur', 'Ayu', 'Dian', 'Eka', 'Farida', 'Gita', 'Hani', 'Ika', 'Jihan', 'Kania', 'Lia', 'Mega', 'Nina', 'Olivia', 'Putri', 'Qory', 'Rani', 'Sinta', 'Tyas'],
        surname: ['Setiawan', 'Gunawan', 'Wijaya', 'Santoso', 'Kurniawan', 'Wibowo', 'Sutrisno', 'Hartono', 'Susanto', 'Pranoto', 'Suryanto', 'Nugroho', 'Darmawan', 'Prabowo', 'Haryanto', 'Sudarsono', 'Raharjo', 'Widodo', 'Iskandar', 'Sugiarto', 'Maulana', 'Permana', 'Suharto', 'Pratama', 'Nurdiansyah', 'Mahendra', 'Kusuma', 'Utomo', 'Syahputra', 'Rahman']
    },
    FILIPINO: {
        male: ['Bayani', 'Datu', 'Lapu', 'Makisig', 'Rajah', 'Juan', 'Jose', 'Miguel', 'Rafael', 'Gabriel', 'Daniel', 'Carlos', 'Antonio', 'Pedro', 'Francisco', 'Manuel', 'Ricardo', 'Eduardo', 'Roberto', 'Alberto', 'Rodrigo', 'Diego', 'Fernando', 'Andres', 'Emilio', 'Ramon', 'Luis', 'Mario', 'Ernesto', 'Alfredo'],
        female: ['Diwata', 'Tala', 'Mayumi', 'Ligaya', 'Maria', 'Ana', 'Rosa', 'Carmen', 'Teresa', 'Gloria', 'Elena', 'Lucia', 'Isabel', 'Cristina', 'Patricia', 'Josefina', 'Luisa', 'Esperanza', 'Concepcion', 'Remedios', 'Corazon', 'Milagros', 'Felicidad', 'Paz', 'Soledad', 'Rosario', 'Aurora', 'Estrella', 'Angelica', 'Beatriz'],
        surname: ['dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Gonzales', 'Castillo', 'Cruz', 'Morales', 'Rodriguez', 'Lopez', 'Martinez', 'Hernandez', 'Villanueva', 'Santiago', 'Ramos', 'Aquino', 'Bautista', 'Fernandez', 'Gutierrez', 'Valdez', 'Rivera', 'Mercado', 'Dizon', 'Navarro', 'Salazar', 'Domingo', 'Aguilar']
    },

    // === EASTERN EUROPEAN SPECIFICS ===
    POLISH: {
        male: ['Jan', 'Piotr', 'Krzysztof', 'Andrzej', 'Tomasz', 'Pawel', 'Michal', 'Stanislaw', 'Marek', 'Jacek', 'Jerzy', 'Tadeusz', 'Adam', 'Zbigniew', 'Ryszard', 'Kazimierz', 'Henryk', 'Mariusz', 'Dariusz', 'Jaroslaw', 'Wlodzimierz', 'Leszek', 'Bogdan', 'Grzegorz', 'Wojciech', 'Miroslaw', 'Zygmunt', 'Witold', 'Czeslaw', 'Boleslaw'],
        female: ['Maria', 'Anna', 'Katarzyna', 'Malgorzata', 'Agnieszka', 'Barbara', 'Ewa', 'Elzbieta', 'Krystyna', 'Zofia', 'Teresa', 'Jadwiga', 'Danuta', 'Halina', 'Irena', 'Stanislawa', 'Grazyna', 'Janina', 'Czeslawa', 'Wiesawa', 'Stefania', 'Aleksandra', 'Joanna', 'Helena', 'Urszula', 'Dorota', 'Beata', 'Renata', 'Iwona', 'Bozena'],
        surname: ['Nowak', 'Kowalski', 'Wisniewski', 'Wojcik', 'Kowalczyk', 'Kaminski', 'Lewandowski', 'Zielinski', 'Szymanski', 'Wozniak', 'Dabrowski', 'Kozlowski', 'Jankowski', 'Mazur', 'Kwiatkowski', 'Krawczyk', 'Kaczmarek', 'Piotrowski', 'Grabowski', 'Nowakowski', 'Pawlowski', 'Michalski', 'Nowicki', 'Adamski', 'Dudek', 'Zajac', 'Wieczorek', 'Jakubowski', 'Jasinski', 'Zawadzki']
    },
    CZECH: {
        male: ['Jan', 'Petr', 'Josef', 'Pavel', 'Tomas', 'Jaroslav', 'Frantisek', 'Miroslav', 'Vaclav', 'Martin', 'Jiri', 'Michal', 'Vladislav', 'Lukas', 'David', 'Jakub', 'Stanislav', 'Ladislav', 'Ondrej', 'Radek', 'Marek', 'Filip', 'Ales', 'Milan', 'Viktor', 'Roman', 'Daniel', 'Adam', 'Matej', 'Vojtech'],
        female: ['Marie', 'Jana', 'Eva', 'Anna', 'Hana', 'Vera', 'Alena', 'Lenka', 'Kvetoslava', 'Jarmila', 'Ludmila', 'Helena', 'Jirina', 'Božena', 'Zuzana', 'Libuse', 'Milada', 'Vlasta', 'Jaromira', 'Marketa', 'Tereza', 'Katerina', 'Petra', 'Simona', 'Michaela', 'Veronika', 'Barbora', 'Klara', 'Adela', 'Nikola'],
        surname: ['Novak', 'Svoboda', 'Novotny', 'Dvorak', 'Cerny', 'Prochazka', 'Krejci', 'Horak', 'Nemec', 'Pokorny', 'Pospisil', 'Havel', 'Kadlec', 'Ruzicka', 'Benes', 'Fiala', 'Sedlacek', 'Dolejsi', 'Zeman', 'Nguyen', 'Kucerov', 'Vesely', 'Bartos', 'Kolar', 'Cervenka', 'Urban', 'Brabec', 'Sikora', 'Machacek', 'Tuma']
    },
    HUNGARIAN: {
        male: ['József', 'János', 'László', 'István', 'Ferenc', 'Sándor', 'Gábor', 'Péter', 'Zoltán', 'Attila', 'Tamás', 'Balázs', 'Mihály', 'Tibor', 'András', 'Károly', 'Géza', 'Imre', 'Gyula', 'Béla', 'Árpád', 'Kálmán', 'Ernő', 'Jenő', 'Viktor', 'Dezső', 'Olivér', 'Ákos', 'Csaba', 'Levente'],
        female: ['Mária', 'Erzsébet', 'Katalin', 'Ilona', 'Éva', 'Anna', 'Margit', 'Judit', 'Andrea', 'Krisztina', 'Ágnes', 'Zsuzsanna', 'Gabriella', 'Mónika', 'Erika', 'Aniko', 'Beatrix', 'Brigitta', 'Csilla', 'Dorottya', 'Eszter', 'Fanni', 'Hajnalka', 'Ildikó', 'Julianna', 'Klára', 'Lívia', 'Noémi', 'Orsolya', 'Réka'],
        surname: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas', 'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos', 'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete', 'Szűcs', 'Kerekes', 'Antal', 'Magyar', 'Gál', 'Fülöp', 'Hegedűs', 'Deák', 'Hajdu', 'Vincze']
    },
    ROMANIAN: {
        male: ['Ion', 'Gheorghe', 'Nicolae', 'Vasile', 'Dumitru', 'Petru', 'Constantin', 'Stefan', 'Marin', 'Florin', 'Adrian', 'Mihai', 'Dan', 'Lucian', 'Cristian', 'Alexandru', 'George', 'Marius', 'Daniel', 'Dragos', 'Radu', 'Catalin', 'Bogdan', 'Andrei', 'Sorin', 'Liviu', 'Ionut', 'Viorel', 'Gabriel', 'Cosmin'],
        female: ['Maria', 'Elena', 'Ioana', 'Ana', 'Mihaela', 'Daniela', 'Cristina', 'Andreea', 'Carmen', 'Lidia', 'Monica', 'Simona', 'Alina', 'Gabriela', 'Diana', 'Roxana', 'Oana', 'Luminita', 'Florentina', 'Adina', 'Camelia', 'Lavinia', 'Raluca', 'Corina', 'Nicoleta', 'Ramona', 'Viorica', 'Florina', 'Lacramioara', 'Georgiana'],
        surname: ['Popescu', 'Popa', 'Pop', 'Radu', 'Stoica', 'Dragomir', 'Munteanu', 'Dima', 'Georgescu', 'Matei', 'Barbu', 'Nistor', 'Florea', 'Diaconu', 'Toma', 'Stancu', 'Mocanu', 'Grigore', 'Iancu', 'Marinescu', 'Dumitrescu', 'Rusu', 'Cristea', 'Mihai', 'Preda', 'Andrei', 'Nicolae', 'Radulescu', 'Ionescu', 'Constantinescu']
    },
    BULGARIAN: {
        male: ['Ivan', 'Georgi', 'Dimitar', 'Nikolai', 'Petar', 'Stefan', 'Hristo', 'Todor', 'Angel', 'Bozhidar', 'Vasil', 'Asen', 'Kamen', 'Rumen', 'Plamen', 'Lyubomir', 'Zdravko', 'Stanimir', 'Borislav', 'Radoslav', 'Milen', 'Valentin', 'Emil', 'Yordan', 'Krasimir', 'Atanas', 'Kiril', 'Pavel', 'Martin', 'Alexander'],
        female: ['Maria', 'Elena', 'Svetlana', 'Valentina', 'Nadia', 'Gergana', 'Desislava', 'Tsvetanka', 'Rumiana', 'Milena', 'Zlatka', 'Anelia', 'Daniela', 'Vesela', 'Miglena', 'Radka', 'Teodora', 'Bilyana', 'Petya', 'Galina', 'Iskra', 'Rositsa', 'Boryana', 'Dimitrina', 'Yordanka', 'Kalina', 'Margarita', 'Antonia', 'Silviya', 'Kristina'],
        surname: ['Ivanov', 'Petrov', 'Dimitrov', 'Georgiev', 'Nikolov', 'Hristov', 'Todorov', 'Angelov', 'Stoyanov', 'Stefanov', 'Vasilev', 'Bozhilov', 'Kamenov', 'Rumenov', 'Plamenov', 'Lyubomirov', 'Zdravkov', 'Stanimirov', 'Borislavov', 'Radoslavov', 'Milenov', 'Valentinov', 'Emilov', 'Yordanov', 'Krasimirov', 'Atanasov', 'Kirilov', 'Pavlov', 'Martinov', 'Alexandrov']
    },
    SERBIAN: {
        male: ['Marko', 'Stefan', 'Nikola', 'Aleksandar', 'Milos', 'Luka', 'Filip', 'Nemanja', 'Dusan', 'Vladimir', 'Petar', 'Milan', 'Jovana', 'Bogdan', 'Dejan', 'Zoran', 'Dragan', 'Goran', 'Sasa', 'Branko', 'Predrag', 'Nebojsa', 'Miroslav', 'Rajko', 'Slobodan', 'Milorad', 'Bojan', 'Darko', 'Srdjan', 'Velimir'],
        female: ['Ana', 'Marija', 'Jovana', 'Milica', 'Aleksandra', 'Tamara', 'Jelena', 'Nadja', 'Sara', 'Teodora', 'Mina', 'Isidora', 'Andrea', 'Anja', 'Sofija', 'Una', 'Katarina', 'Magdalena', 'Petra', 'Iva', 'Dunja', 'Mila', 'Andjela', 'Lara', 'Nevena', 'Maša', 'Emilija', 'Vanja', 'Kristina', 'Dragana'],
        surname: ['Jovanovic', 'Petrovic', 'Nikolic', 'Stojanovic', 'Popovic', 'Milosevic', 'Markovic', 'Djordjevic', 'Stankovic', 'Ilic', 'Pavlovic', 'Milenkovic', 'Vasic', 'Tosic', 'Radic', 'Savic', 'Antic', 'Milic', 'Stefanovic', 'Bogdanovic', 'Zivojinovic', 'Mladenovic', 'Andjelkovic', 'Lazic', 'Matic', 'Simic', 'Dimitrijevic', 'Vukovic', 'Radovanovic', 'Jankovic']
    },
    CROATIAN: {
        male: ['Marko', 'Luka', 'Filip', 'David', 'Mateo', 'Petar', 'Antonio', 'Josip', 'Ivan', 'Matej', 'Dario', 'Nikola', 'Lovro', 'Tomislav', 'Kristijan', 'Stjepan', 'Mario', 'Ante', 'Zvonimir', 'Dragan', 'Miljenko', 'Davor', 'Goran', 'Zoran', 'Ivo', 'Branko', 'Mladen', 'Božo', 'Zdravko', 'Franjo'],
        female: ['Petra', 'Ana', 'Lucija', 'Ema', 'Sara', 'Lana', 'Mia', 'Tea', 'Elena', 'Nika', 'Marija', 'Klara', 'Iva', 'Karin', 'Dora', 'Paula', 'Antonija', 'Karla', 'Marta', 'Nina', 'Lara', 'Anja', 'Barbara', 'Katarina', 'Mirna', 'Vesna', 'Gordana', 'Božica', 'Ljiljana', 'Jadranka'],
        surname: ['Horvat', 'Kovačić', 'Babić', 'Marić', 'Novak', 'Jurić', 'Knežević', 'Marković', 'Petrović', 'Matić', 'Tomić', 'Kovačević', 'Šimić', 'Božić', 'Blažević', 'Pavić', 'Grgić', 'Radić', 'Pavlović', 'Vuković', 'Lovrić', 'Jukić', 'Zec', 'Šarić', 'Stipić', 'Bilić', 'Cvjetković', 'Dragić', 'Filipović', 'Galić']
    },

    // === CENTRAL ASIAN SPECIFICS ===
    KAZAKH: {
        male: ['Abai', 'Almas', 'Arman', 'Askhat', 'Baurzhan', 'Beibit', 'Damir', 'Dias', 'Dinmukhamed', 'Erlan', 'Galymzhan', 'Kanat', 'Marat', 'Nurasyl', 'Olzhas', 'Rustem', 'Samat', 'Serik', 'Talgat', 'Timur', 'Askar', 'Bakhytzhan', 'Darkhan', 'Eldos', 'Farabi', 'Kairat', 'Maksut', 'Nurlan', 'Saltanat', 'Yerzhan'],
        female: ['Aida', 'Aigerim', 'Aizhan', 'Akmaral', 'Assel', 'Bakhyt', 'Daniya', 'Gulnara', 'Indira', 'Kamila', 'Karlygash', 'Kundyz', 'Madina', 'Nazgul', 'Raushan', 'Saule', 'Symbat', 'Togzhan', 'Ulbala', 'Zhansaya', 'Ainur', 'Balzhan', 'Dinara', 'Elmira', 'Fariza', 'Gaukhar', 'Kamshat', 'Meruyert', 'Perizat', 'Saltanat'],
        surname: ['Nazarbayev', 'Tokayev', 'Kasymov', 'Masanov', 'Sarybaev', 'Omarov', 'Zhumabekov', 'Karimov', 'Serikbaev', 'Akhmetov', 'Tursunbaev', 'Kenzhebaev', 'Urazbaev', 'Suleimenov', 'Iskakov', 'Zhakypov', 'Mukanov', 'Berdyev', 'Kozhakhmetov', 'Aydarbaev', 'Kairatuly', 'Alikhanuly', 'Tolegenuly', 'Dauletuly', 'Serikuly', 'Abilkhanuly', 'Kairatovich', 'Serikovich', 'Tolegenovich', 'Dauletovich']
    },
    UZBEK: {
        male: ['Akmal', 'Alisher', 'Aziz', 'Bobur', 'Davron', 'Dilshod', 'Farhod', 'Gulom', 'Hamza', 'Islom', 'Jasur', 'Kamol', 'Laziz', 'Muhammed', 'Nodir', 'Otabek', 'Pulat', 'Ravshan', 'Sanjar', 'Temur', 'Ulugbek', 'Vohid', 'Xasan', 'Yusuf', 'Zafar', 'Abbos', 'Bakhtiyor', 'Doniyor', 'Elbek', 'Feruz'],
        female: ['Aziza', 'Dilnoza', 'Feruza', 'Gulnoza', 'Hilola', 'Iroda', 'Jamila', 'Kamola', 'Latifa', 'Mavluda', 'Nafisa', 'Ozoda', 'Parvina', 'Roziya', 'Sabina', 'Tanzila', 'Umida', 'Vasila', 'Ximoya', 'Yulduz', 'Zarina', 'Adolat', 'Barno', 'Dilafruz', 'Elmira', 'Fazila', 'Gulchehra', 'Husnora', 'Iqbol', 'Jahongir'],
        surname: ['Karimov', 'Mirziyoyev', 'Rakhmonov', 'Saidov', 'Toshmatov', 'Umarov', 'Vakhobov', 'Xolmatov', 'Yusupov', 'Zokirov', 'Abdullayev', 'Baxtiyorov', 'Davlatov', 'Erkinov', 'Fayzullayev', 'Gulomov', 'Hakimov', 'Ismoilov', 'Juraev', 'Komilov', 'Latipov', 'Mahmudov', 'Normatov', 'Olimov', 'Pulatov', 'Rustamov', 'Sobirov', 'Turdiev', 'Usmonov', 'Valiyev']
    },
    KYRGYZ: {
        male: ['Adilet', 'Almaz', 'Askar', 'Azamat', 'Bakyt', 'Bektur', 'Dastan', 'Ermek', 'Gulzar', 'Kanybek', 'Manas', 'Nurdin', 'Omurbek', 'Ruslan', 'Sanzhar', 'Taalai', 'Ulan', 'Zhanybek', 'Akylbek', 'Bakirdin', 'Cholpon', 'Daniyar', 'Eldiyar', 'Farkhad', 'Kadyrbek', 'Maksat', 'Nurlan', 'Sanjar', 'Timur', 'Ulanbek'],
        female: ['Aida', 'Bermet', 'Cholpon', 'Dinara', 'Elnura', 'Gulzat', 'Jyldyz', 'Kanykei', 'Medina', 'Nazgul', 'Perizat', 'Saira', 'Tolkun', 'Umut', 'Zarina', 'Ainagul', 'Baktygul', 'Chynara', 'Elmira', 'Gulnara', 'Kunduz', 'Nurgul', 'Saltanat', 'Venera', 'Zamira', 'Asel', 'Burul', 'Damira', 'Gulsara', 'Kalima'],
        surname: ['Jeenbekov', 'Atambaev', 'Akayev', 'Bakiyev', 'Isakov', 'Mamatov', 'Orozov', 'Satybaldiev', 'Tashiev', 'Usubaliev', 'Abdyldaev', 'Bakirov', 'Davletov', 'Ergeshov', 'Kasybekov', 'Moldokmatov', 'Nurmatov', 'Osmonov', 'Rayimkulov', 'Sharipov', 'Temirov', 'Urmatov', 'Zulpukarov', 'Aitmatov', 'Beishenaliev', 'Choroev', 'Dzhumakadyrov', 'Esengaliev', 'Kydyraliev', 'Mamytov']
    },
    TURKMEN: {
        male: ['Agamyrat', 'Atamyrat', 'Berdimuhamedow', 'Dovletmyrat', 'Gurbansoltan', 'Maksat', 'Niyazov', 'Oguzhan', 'Serdar', 'Wyacheslav', 'Amangeldy', 'Batyr', 'Dowletgeldi', 'Gurbanmyrat', 'Kerim', 'Meret', 'Oraz', 'Rustam', 'Tachmyrat', 'Yklym', 'Akmyrat', 'Begench', 'Dovrangeldi', 'Gurbanguly', 'Kemal', 'Myrat', 'Orazmyrat', 'Saparmurad', 'Tagamyrat', 'Yazmyrat'],
        female: ['Akgul', 'Aygul', 'Bibi', 'Gulnar', 'Jamila', 'Leyli', 'Maral', 'Nazik', 'Ogulabat', 'Soltan', 'Altyn', 'Bahar', 'Gozal', 'Jennet', 'Mahri', 'Nargiz', 'Ogulabibi', 'Rahima', 'Shirin', 'Yasmyn', 'Ayna', 'Begul', 'Gulzada', 'Jemile', 'Mambet', 'Nazgul', 'Orazsoltan', 'Sona', 'Turkan', 'Ziba'],
        surname: ['Berdimuhamedow', 'Niyazov', 'Gurbanguly', 'Atayev', 'Durdyev', 'Geldyev', 'Hojayev', 'Jumaev', 'Kurbanov', 'Mamedov', 'Nuryev', 'Orazov', 'Rejepov', 'Saparmuradov', 'Tachmyradov', 'Yazmuradov', 'Agayev', 'Berdyev', 'Durdymyradov', 'Garayev', 'Ilyasov', 'Kadyrov', 'Muradov', 'Omarov', 'Sadykov', 'Urazov', 'Veliyev', 'Yusupov', 'Charyyev', 'Hojanepesov']
    },

    // === SPECIFIC PACIFIC ISLANDS ===
    HAWAIIAN: {
        male: ['Koa', 'Keoni', 'Kawika', 'Ikaika', 'Akamu', 'Keanu', 'Makoa', 'Kekoa', 'Kahoku', 'Kanoa', 'Kalani', 'Kaleo', 'Keola', 'Kainoa', 'Keawe', 'Kekai', 'Kapono', 'Lopaka', 'Mahina', 'Nalani', 'Pika', 'Tane', 'Ulani', 'Waika', 'Keali', 'Kimo', 'Kaipo', 'Kamal', 'Kanaloa', 'Kamalu'],
        female: ['Leilani', 'Malia', 'Nalani', 'Mahina', 'Naia', 'Lehua', 'Pua', 'Kalani', 'Noelani', 'Kalea', 'Mele', 'Pikake', 'Lilia', 'Anela', 'Kailani', 'Mailani', 'Kaila', 'Kawena', 'Akela', 'Ailana', 'Eleu', 'Haumea', 'Iolana', 'Kaia', 'Laka', 'Moana', 'Nayeli', 'Olina', 'Palila', 'Ulani'],
        surname: ['o Koa', 'o Keoni', 'o Kawika', 'o Ikaika', 'o Akamu', 'o Keanu', 'o Makoa', 'o Kekoa', 'o Kahoku', 'o Kanoa', 'o Kalani', 'o Kaleo', 'o Keola', 'o Kainoa', 'o Keawe', 'o Kekai', 'o Kapono', 'o Lopaka', 'o Mahina', 'o Nalani']
    },
    TAHITIAN: {
        male: ['Teiva', 'Marama', 'Pito', 'Terai', 'Hiro', 'Manuarii', 'Pomare', 'Tuahine', 'Teriitearia', 'Mahina', 'Heimana', 'Vaitea', 'Teikihuupoko', 'Teriimana', 'Tehei', 'Teva', 'Tuanaki', 'Raimana', 'Taumalolo', 'Vaite', 'Teiti', 'Heiarii', 'Tuianu', 'Moea', 'Teanua', 'Vaea', 'Ahuarii', 'Teariki', 'Tauatua', 'Terupe'],
        female: ['Tiare', 'Moea', 'Raina', 'Maeva', 'Vaimiti', 'Terehia', 'Hinanui', 'Tehina', 'Vaiata', 'Maituarii', 'Rava', 'Titaua', 'Tarita', 'Teiva', 'Poehina', 'Vaiana', 'Hinatea', 'Mehiata', 'Teuira', 'Vaitea', 'Tehei', 'Moina', 'Raita', 'Teariki', 'Vahine', 'Poema', 'Marama', 'Heiata', 'Teura', 'Mareva'],
        surname: ['a Teiva', 'a Marama', 'a Pito', 'a Terai', 'a Hiro', 'a Manuarii', 'a Pomare', 'a Tuahine', 'a Mahina', 'a Heimana', 'a Vaitea', 'a Teriimana', 'a Tehei', 'a Teva', 'a Tuanaki', 'a Raimana', 'a Taumalolo', 'a Vaite', 'a Teiti', 'a Heiarii']
    },
    SAMOAN: {
        male: ['Sione', 'Tavita', 'Paulo', 'Lemi', 'Filipo', 'Ioane', 'Mika', 'Pita', 'Siaki', 'Toma', 'Falaniko', 'Iakopo', 'Mose', 'Siaosi', 'Teleke', 'Uelese', 'Viliami', 'Salesi', 'Tanielu', 'Iosua', 'Simona', 'Lopeti', 'Kalolo', 'Manoa', 'Pauli', 'Setu', 'Tuifua', 'Vaea', 'Alamai', 'Faletau'],
        female: ['Sina', 'Mele', 'Ana', 'Luisa', 'Mere', 'Salote', 'Talei', 'Vika', 'Elisapeta', 'Katalina', 'Losa', 'Maria', 'Penelopi', 'Silia', 'Teuila', 'Vaofou', 'Adeline', 'Faasisina', 'Ilaisa', 'Leilua', 'Moana', 'Noumea', 'Peka', 'Rosita', 'Taimalelagi', 'Vaitoa', 'Christina', 'Fialelei', 'Lagi', 'Tausala'],
        surname: ['Tuisamoa', 'Malietoa', 'Mataafa', 'Tamasese', 'Tuimalealiifano', 'Tuiatua', 'Tuivaga', 'Aiono', 'Leaupepe', 'Luamanuvao', 'Namulauulu', 'Papalii', 'Seumanutafa', 'Tanuvasa', 'Tootoovao', 'Tuatagaloa', 'Vaai', 'Afamasaga', 'Faumuina', 'Fuimaono']
    },
    TONGAN: {
        male: ['Tevita', 'Sione', 'Pita', 'Sitiveni', 'Viliami', 'Paula', 'Manu', 'Salote', 'Koli', 'Folau', 'Tevita', 'Finau', 'Latu', 'Moala', 'Pohiva', 'Taumalolo', 'Vea', 'Afeaki', 'Havea', 'Kilikiti', 'Lopeti', 'Mafile', 'Naufahu', 'Palani', 'Sia', 'Taufua', 'Uikelotu', 'Vaipulu', 'Wolfgramm', 'Faka'],
        female: ['Salote', 'Mele', 'Ana', 'Sela', 'Mere', 'Luisa', 'Ofa', 'Vika', 'Talei', 'Lupe', 'Malia', 'Siutiti', 'Tevita', 'Losaline', 'Pilimilose', 'Seini', 'Telani', 'Vahe', 'Amelia', 'Filomena', 'Kalo', 'Lavinia', 'Makerita', 'Nola', 'Penina', 'Semisi', 'Tupou', 'Unaloto', 'Veiongo', 'Alohalani'],
        surname: ['Tupou', 'Moala', 'Finau', 'Latu', 'Pohiva', 'Taumalolo', 'Vea', 'Afeaki', 'Havea', 'Kilikiti', 'Lopeti', 'Mafile', 'Naufahu', 'Palani', 'Sia', 'Taufua', 'Uikelotu', 'Vaipulu', 'Wolfgramm', 'Faka', 'Helu', 'Kaho', 'Manu', 'Otai', 'Puloka', 'Taione', 'Vake', 'Aleamotu', 'Fonua', 'Kaufusi']
    },
    FIJIAN: {
        male: ['Jone', 'Ratu', 'Seru', 'Temo', 'Viliame', 'Watisoni', 'Aminiasi', 'Josaia', 'Lemeki', 'Marika', 'Penioni', 'Sakiasi', 'Tomasi', 'Alipate', 'Isoa', 'Kolinio', 'Manasa', 'Neumi', 'Pauliasi', 'Semiti', 'Uraia', 'Viliami', 'Apakuki', 'Ilaisa', 'Kitione', 'Milika', 'Osea', 'Seremaia', 'Tevita', 'Waisea'],
        female: ['Mere', 'Salote', 'Ana', 'Litia', 'Maria', 'Sala', 'Teresia', 'Adi', 'Bulou', 'Episalote', 'Kesaia', 'Makereta', 'Salanieta', 'Talei', 'Vasiti', 'Alisi', 'Fulori', 'Kelera', 'Lusi', 'Naomi', 'Salote', 'Tokasa', 'Varanisese', 'Asenaca', 'Ilisapeci', 'Loloma', 'Milika', 'Raijeli', 'Sera', 'Una'],
        surname: ['Bose', 'Dakuwaqa', 'Leweniqila', 'Mataitoga', 'Nailatikau', 'Ratunabuabua', 'Seniloli', 'Tavatavanawai', 'Vuanirewa', 'Waqa', 'Cakobau', 'Ganilau', 'Koroilavesau', 'Mara', 'Qarase', 'Roko', 'Tui', 'Vuki', 'Bolabola', 'Cavuilati']
    },

    // === NATIVE AMERICAN TRIBAL SPECIFICS ===
    APACHE: {
        male: ['Bidziil', 'Cochise', 'Dahkeya', 'Elan', 'Goyahkla', 'Hastiin', 'Illanipi', 'Jacy', 'Klah', 'Kuruk', 'Naiche', 'Nayati', 'Nantan', 'Mangas', 'Chato', 'Taza', 'Nana', 'Loco', 'Juh', 'Alchise', 'Tsela', 'Bodaway', 'Delshay', 'Eskiminzin', 'Nahiossi', 'Naalnish', 'Tsintah', 'Itza-chu', 'Kas-tziden', 'Tse-ne-gat'],
        female: ['Aiyana', 'Chosposi', 'Dezba', 'Gouyen', 'Huera', 'Ipa', 'Jacali', 'Kachina', 'Lozen', 'Nalin', 'Ooljee', 'Paloma', 'Sonseeahray', 'Tala', 'Unega', 'Dahteste', 'Ishton', 'Siki', 'Zi-yeh', 'Beshad-e', 'Ih-tedda', 'She-gha', 'Ih-na-tah', 'Nah-dos-te', 'Shtsha-she', 'E-clah-heh', 'Dilth-cleyhen', 'Bi-ya-neta', 'Tzoe-ay', 'Nah-de-yole'],
        surname: ['Chiricahua', 'Mescalero', 'Jicarilla', 'Lipan', 'Western-Apache', 'Plains-Apache', 'White-Mountain', 'San-Carlos', 'Cibecue', 'Tonto']
    },
    CHEROKEE: {
        male: ['Atsila', 'Danuwoa', 'Gola', 'Kanuna', 'Mohe', 'Onacona', 'Salali', 'Tsiyi', 'Waya', 'Yona', 'Aganvdisi', 'Adahy', 'Ahanu', 'Degotoga', 'Gawonii', 'Kanoska', 'Oconostota', 'Ostenaco', 'Attakullakulla', 'Doublehead', 'Pathkiller', 'Tahchee', 'Utsidihi', 'Wohali', 'Yonaguska', 'Tsunu', 'Ganundalegi', 'Sequoyah', 'Junaluska', 'Oosahwee'],
        female: ['Adsila', 'Agasga', 'Amadahy', 'Awenasa', 'Ayita', 'Galilahi', 'Immookalee', 'Inola', 'Nanye-hi', 'Noya', 'Salali', 'Selu', 'Tayanita', 'Tsula', 'Walela', 'Winona', 'Ghigau', 'Ama', 'Gola', 'Kamama', 'Nidia', 'Oota', 'Sequoia', 'Tala', 'Usdi', 'Wahya', 'Yonah', 'Nvda', 'Svnoyi', 'Agitsi'],
        surname: ['Aniwaya', 'Anigatogewi', 'Anisahoni', 'Aniwodi', 'Anitsisqua', 'Aniwahya', 'Anikawi', 'Wolf-Clan', 'Deer-Clan', 'Bird-Clan', 'Paint-Clan', 'Blue-Clan', 'Long-Hair-Clan', 'Wild-Potato-Clan']
    },
    IROQUOIS_HAUDENOSAUNEE: {
        male: ['Deganawidah', 'Hiawatha', 'Tadodaho', 'Skenandoa', 'Oronhyatekha', 'Kanonwat', 'Tekarihoga', 'Otsembo', 'Kanonsonnion', 'Ganeodiyo', 'Donehogawa', 'Sganyadaiyoh', 'Kaienke', 'Ronkahrawah', 'Tahamont', 'Kaneeda', 'Soyent', 'Ganunda', 'Kanadagea', 'Oneida', 'Onondaga', 'Cayuga', 'Seneca', 'Mohawk', 'Tuscarora'],
        female: ['Kateri', 'Onatah', 'Aiyana', 'Kachina', 'Oneida', 'Tekawitha', 'Konwatsi', 'Kahente', 'Kawenaa', 'Katsitsio', 'Otsi', 'Onen', 'Skennen', 'Tewenissa', 'Yakowi', 'Kohana', 'Wenona', 'Kanontiio', 'Onawa', 'Wadewi', 'Awenasa', 'Gawonii', 'Kanessa', 'Ojistah', 'Sequoia'],
        surname: ['Turtle-Clan', 'Wolf-Clan', 'Bear-Clan', 'Beaver-Clan', 'Deer-Clan', 'Hawk-Clan', 'Snipe-Clan', 'Heron-Clan', 'Eel-Clan']
    },
    CREEK_MUSKOGEE: {
        male: ['Opothleyahola', 'Menawa', 'Chitto', 'Harjo', 'Emathla', 'Yahola', 'Fixico', 'Micco', 'Tustunnuggee', 'Holata', 'Hadjo', 'Chopco', 'Kono', 'Semo', 'Nokose', 'Isfaha', 'Taskigi', 'Hopoithle', 'Apushimataha', 'Takosa'],
        female: ['Coosa', 'Lowak', 'Talisi', 'Mahila', 'Sehoy', 'Pakana', 'Chehaw', 'Nanih', 'Wakokai', 'Fuswa', 'Hillis', 'Osochi', 'Sawokli', 'Tukabahchi', 'Wetumpka', 'Abihka', 'Atasi', 'Kealedji', 'Kolomi', 'Okchai'],
        surname: ['Harjo', 'Emathla', 'Yahola', 'Fixico', 'Micco', 'Hadjo', 'Chopco', 'Wind-Clan', 'Bear-Clan', 'Beaver-Clan', 'Bird-Clan', 'Deer-Clan', 'Alligator-Clan', 'Potato-Clan', 'Hickory-Clan']
    },
    ALGONQUIAN: {
        male: ['Metacomet', 'Massasoit', 'Powhatan', 'Pontiac', 'Tecumseh', 'Wabanaki', 'Samoset', 'Squanto', 'Canonicus', 'Miantonomo', 'Uncas', 'Sassacus', 'Paugus', 'Passaconaway', 'Wonalancet', 'Kancamagus', 'Madockawando', 'Bashaba', 'Nanapush', 'Keokuk'],
        female: ['Pocahontas', 'Wetamoo', 'Awashonks', 'Weetamoo', 'Mononotto', 'Cockacoeske', 'Totopotomoi', 'Nicketti', 'Wunne', 'Askook', 'Namumpum', 'Quaiapen', 'Magnus', 'Matantuck', 'Wootonekanuske', 'Oppussoquionuske', 'Aspenquid', 'Mamanuette', 'Sunksquaw', 'Winema'],
        surname: ['Wampanoag', 'Narragansett', 'Pequot', 'Mohegan', 'Nipmuc', 'Pocumtuck', 'Pennacook', 'Abenaki', 'Passamaquoddy', 'Micmac', 'Maliseet', 'Lenape', 'Shawnee', 'Ojibwe', 'Potawatomi', 'Menominee', 'Sauk', 'Fox', 'Kickapoo', 'Miami']
    },
    PUEBLO: {
        male: ['Popé', 'Tewa', 'Keres', 'Tiwa', 'Acoma', 'Taos', 'Cochiti', 'Nambe', 'Ohkay', 'Picuris', 'Pojoaque', 'Sandia', 'Tesuque', 'Isleta', 'Laguna', 'Masewa', 'Oyoyewa', 'Poseyemu', 'Montezuma', 'Payatamu'],
        female: ['Aiyana', 'Kaya', 'Mika', 'Nova', 'Sora', 'Tiva', 'Yara', 'Kiva', 'Mesa', 'Hopi', 'Keres', 'Tewa', 'Butterfly', 'Kachina', 'Kokopelli', 'Selu', 'Corn-Mother', 'Blue-Corn', 'White-Shell', 'Turquoise'],
        surname: ['Sun-Clan', 'Cloud-Clan', 'Corn-Clan', 'Water-Clan', 'Sky-Clan', 'Earth-Clan', 'Turquoise-Clan', 'Eagle-Clan', 'Bear-Clan', 'Antelope-Clan', 'Coyote-Clan', 'Snake-Clan', 'Badger-Clan', 'Butterfly-Clan', 'Parrot-Clan']
    },
    INUIT: {
        male: ['Nanook', 'Amarok', 'Atka', 'Nukka', 'Tulugaq', 'Qimmiq', 'Siku', 'Akiak', 'Desna', 'Iluq', 'Kallik', 'Malik', 'Nuka', 'Pakak', 'Sesi', 'Taqtu', 'Ukiuk', 'Yuka', 'Toklo', 'Nayuk'],
        female: ['Sedna', 'Sila', 'Pania', 'Kira', 'Miki', 'Nayuk', 'Suki', 'Uki', 'Yura', 'Aput', 'Atiqtalik', 'Buniq', 'Cupun', 'Ila', 'Kavik', 'Malina', 'Naia', 'Purnaq', 'Sakari', 'Uki'],
        surname: ['Angakok', 'Tikivik', 'Kakortok', 'Nanuq', 'Sirmiq', 'Tulugaq', 'Umiak', 'Iglu', 'Kayak', 'Tupik', 'Kamik', 'Anorak', 'Mukluk', 'Parka', 'Qiviut']
    },
    LAKOTA_SIOUX: {
        male: ['Tatanka', 'Mahpiya', 'Wanbli', 'Mato', 'Cetan', 'Hehaka', 'Takoda', 'Ohiyesa', 'Akecheta', 'Chayton', 'Enapay', 'Kangee', 'Lootah', 'Nashoba', 'Ogleesha', 'Pahana', 'Shappa', 'Tashunka', 'Wahkan', 'Yahto', 'Chaska', 'Ezhno', 'Hotah', 'Bidziil', 'Kohana'],
        female: ['Winona', 'Wakanda', 'Talulah', 'Kimama', 'Maka', 'Nina', 'Ojinjintka', 'Ptaysanwee', 'Skawin', 'Tawana', 'Wachiwi', 'Weayaya', 'Winema', 'Zitkala', 'Anpao', 'Chumani', 'Ehawee', 'Hanwi', 'Kimimela', 'Makawee', 'Mitena', 'Nahimana', 'Pakuna', 'Sahkyo', 'Takala'],
        surname: ['Mato-Tope', 'Wanbli-Waste', 'Tatanka-Iyotanka', 'Mahpiya-Luta', 'Sunkawakan-Ska', 'Hehaka-Sapa', 'Cetan-Maza', 'Kangee-Sunka', 'Tashunka-Witco', 'Wahkan-Tanka', 'Mato-Sapa', 'Wanbli-Gli', 'Tasunka-Kokipa', 'Mahpiya-Icahtagya', 'Ptaysanwee-Win', 'Hanwi-Wi', 'Wachiwi-Win', 'Zitkala-Sha', 'Anpao-Win', 'Maka-Win']
    },

    // === SURNAME PATTERN IMPLEMENTATIONS ===
    ICELANDIC: {
        male: ['Bjorn', 'Erik', 'Magnus', 'Olaf', 'Ragnar', 'Sigurd', 'Thorvald', 'Gunnar', 'Harald', 'Leif', 'Njal', 'Ulf', 'Egil', 'Snorri', 'Hjalti', 'Kettil', 'Orm', 'Skuli', 'Thord', 'Vigfus', 'Ari', 'Einar', 'Grim', 'Halfdan', 'Jon', 'Kjartan', 'Ljot', 'Odd', 'Ref', 'Stein'],
        female: ['Astrid', 'Bergthora', 'Gudrun', 'Hallgerd', 'Helga', 'Ingrid', 'Jorunn', 'Kristin', 'Ragnhild', 'Sigrid', 'Thora', 'Unn', 'Vigdis', 'Aud', 'Brynhild', 'Dalla', 'Eir', 'Freydis', 'Gro', 'Hild', 'Inga', 'Jora', 'Kari', 'Lif', 'Marta', 'Nanna', 'Oddny', 'Randi', 'Sif', 'Thordis'],
        surname: ['Bjornsson', 'Eriksson', 'Magnusson', 'Olafsson', 'Ragnarsson', 'Sigurdsson', 'Thorvaldsson', 'Gunnarsson', 'Haraldsson', 'Leifsson', 'Njalsson', 'Ulfsson', 'Egilsson', 'Snorrisson', 'Hjaltisson', 'Kettilsson', 'Ormsson', 'Skulisson', 'Thordsson', 'Vigfusson', 'Arisson', 'Einarsson', 'Grimsson', 'Halfdansson', 'Jonsson', 'Kjartansson', 'Ljotsson', 'Oddsson', 'Refsson', 'Steinsson']
    },
    ARABIC_TRADITIONAL: {
        male: ['Ahmad', 'Muhammad', 'Ali', 'Hassan', 'Hussein', 'Omar', 'Khalid', 'Yusuf', 'Ibrahim', 'Ismail', 'Abdullah', 'Abdul Rahman', 'Mahmoud', 'Saeed', 'Tariq', 'Walid', 'Ziad', 'Nasser', 'Faisal', 'Rashid', 'Hamza', 'Jamal', 'Karim', 'Marwan', 'Nabil', 'Qasim', 'Salim', 'Tamer', 'Wael', 'Yazid'],
        female: ['Fatima', 'Aisha', 'Khadija', 'Maryam', 'Zainab', 'Layla', 'Amina', 'Safiya', 'Hajar', 'Ruqayya', 'Umm Kulthum', 'Asma', 'Hafsa', 'Sawda', 'Juwayriya', 'Zaynab', 'Maymuna', 'Umm Salama', 'Ramla', 'Safiyya', 'Ramlah', 'Zaynab', 'Umm Habiba', 'Juwayriyah', 'Safiyyah', 'Maymunah', 'Saudah', 'Hafsah', 'Aishah', 'Khadijah'],
        surname: ['ibn Ahmad', 'ibn Muhammad', 'ibn Ali', 'ibn Hassan', 'ibn Hussein', 'ibn Omar', 'ibn Khalid', 'ibn Yusuf', 'ibn Ibrahim', 'ibn Ismail', 'ibn Abdullah', 'ibn Abdul Rahman', 'ibn Mahmoud', 'ibn Saeed', 'ibn Tariq', 'ibn Walid', 'ibn Ziad', 'ibn Nasser', 'ibn Faisal', 'ibn Rashid', 'al-Hashimi', 'al-Qureshi', 'al-Ansari', 'al-Muhajir', 'al-Tamimi', 'al-Azdi', 'al-Kindi', 'al-Baghdadi', 'al-Dimashqi', 'al-Misri']
    },
    MONGOLIAN_TRADITIONAL: {
        male: ['Temujin', 'Boroldai', 'Jamukha', 'Ong Khan', 'Nilka Sengun', 'Jamuqa', 'Targutai', 'Toghrul', 'Senggum', 'Dai Sechen', 'Yesugei', 'Munlik', 'Charaka', 'Sorgan Shira', 'Chilagun', 'Belgutei', 'Kasar', 'Kachun', 'Temuge', 'Jochi', 'Chagatai', 'Ogedei', 'Tolui', 'Guyuk', 'Mongke', 'Kublai', 'Hulagu', 'Arik Boke', 'Kaidu', 'Nayan'],
        female: ['Borte', 'Khulan', 'Yesugen', 'Yesui', 'Hoelun', 'Sochigel', 'Qojin', 'Ibaqa', 'Tegulen', 'Al-Altun', 'Dokuz Khatun', 'Sorghaqtani', 'Oghul Qaimish', 'Toregene', 'Altani', 'Bayarmaa', 'Enkhtaivan', 'Gantuya', 'Iderkhangai', 'Jargalan', 'Khulan', 'Mandukhai', 'Naran', 'Oyunaa', 'Purevjav', 'Sarangerel', 'Tuul', 'Uyanga', 'Zolzaya', 'Ariiunaa'],
        surname: ['of the Blue Wolf clan', 'of the Golden Eagle clan', 'of the White Horse clan', 'of the Grey Wolf clan', 'of the Black Bear clan', 'of the Red Deer clan', 'of the Silver Fox clan', 'of the Iron Mountain clan', 'of the Jade River clan', 'of the Crystal Lake clan', 'Borjigin', 'Merkid', 'Tayichiud', 'Jadaran', 'Khatagin', "Salji'ud", 'Dorben', 'Ikires', 'Oirat', 'Naiman', 'Kerait', 'Tatar', 'Onggirat', 'Hongirad', 'Unggirat', 'Khonggirat', 'Barlas', 'Dughlat', 'Arlat', 'Manghud']
    }
};

export const REGION_NAME_MAPPING: Record<string, Record<string, Array<{
    before?: number;
    after?: number;
    keys: string[];
}>>> = {
   "EUROPEAN": {
    // British Isles
    "British Isles": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Deep History: Bronze Age
        { after: -800, before: 55, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Iron Age Celts
        { after: 55, before: 410, keys: ['CELTIC_ANCIENT', 'ANCIENT_ROMAN'] }, // Roman Britain
        { after: 410, before: 793, keys: ['ENGLISH_ANGLO_SAXON', 'WELSH', 'SCOTTISH', 'CELTIC_IRISH'] },
        { after: 793, before: 1066, keys: ['ENGLISH_ANGLO_SAXON', 'SCANDINAVIAN', 'WELSH', 'SCOTTISH', 'CELTIC_IRISH'] },
        { after: 1066, before: 1300, keys: ['ENGLISH_MEDIEVAL', 'NORMAN_FRENCH', 'WELSH', 'SCOTTISH', 'CELTIC_IRISH'] },
        { after: 1300, keys: ['ENGLISH', 'WELSH', 'SCOTTISH', 'CELTIC_IRISH'] }
    ],
    // France (Gaul)
    "France": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Deep History: Bronze Age
        { after: -800, before: -52, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Iron Age Gauls
        { after: -52, before: 486, keys: ['ANCIENT_ROMAN', 'PREHISTORIC_PROTO_GERMANIC'] }, // Roman Gaul & Frankish incursions
        { after: 486, before: 751, keys: ['FRANKISH_MEROVINGIAN'] },
        { after: 751, before: 987, keys: ['FRANKISH_CAROLINGIAN'] },
        { after: 987, before: 1100, keys: ['FRENCH_MEDIEVAL', 'NORMAN_FRENCH'] },
        { after: 1100, before: 1450, keys: ['FRENCH_MEDIEVAL'] },
        { after: 1450, keys: ['FRENCH'] }
    ],
    // Iberian Peninsula
    "Iberian Peninsula": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Deep History
        { after: -800, before: -218, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Celtiberian Iron Age
        { after: -218, before: 410, keys: ['ANCIENT_ROMAN'] }, // Roman Hispania
        { after: 410, before: 711, keys: ['ANCIENT_ROMAN', 'GERMAN'] }, // Visigothic period
        { after: 711, before: 1200, keys: ['SPANISH_CASTILIAN', 'PORTUGUESE', 'GALICIAN', 'MAGHREBI', 'ARABIAN_HEJAZ', 'HEBREW'] },
        { after: 1200, before: 1492, keys: ['SPANISH_CASTILIAN', 'PORTUGUESE', 'GALICIAN', 'MAGHREBI'] },
        { after: 1492, keys: ['SPANISH_CASTILIAN', 'PORTUGUESE', 'GALICIAN'] }
    ],
     "Galicia": [
        { before: -25, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Pre-Roman Gallaeci
        { after: -25, before: 410, keys: ['ANCIENT_ROMAN'] },
        { after: 410, before: 711, keys: ['GERMAN'] }, // Suebi & Visigothic
        { after: 711, keys: ['GALICIAN', 'PORTUGUESE', 'SPANISH_CASTILIAN'] }
    ],
    // Italy
    "Italy": [
        { before: -753, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Pre-Roman Italic Tribes
        { after: -753, before: 476, keys: ['ANCIENT_ROMAN', 'ANCIENT_GREEK'] }, // Roman Republic/Empire
        { after: 476, before: 774, keys: ['BYZANTINE', 'GERMAN'] }, // Ostrogothic/Lombard
        { after: 774, before: 1400, keys: ['ITALIAN', 'BYZANTINE', 'NORMAN_FRENCH'] },
        { after: 1400, keys: ['ITALIAN'] }
    ],
    // Germanic Lands
    "Germanic Lands": [
        { before: -500, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Pre-Germanic
        { after: -500, before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] }, // Core Proto-Germanic period
        { after: 200, before: 486, keys: ['GERMAN', 'ANCIENT_ROMAN'] }, // Migration Period
        { after: 486, before: 843, keys: ['FRANKISH_MEROVINGIAN', 'FRANKISH_CAROLINGIAN', 'GERMAN'] },
        { after: 843, before: 1945, keys: ['GERMAN'] },
        { after: 1945, before: 1990, keys: ['GERMAN', 'EAST_GERMAN', 'TURKISH'] },
        { after: 1990, keys: ['GERMAN', 'TURKISH'] }
    ],
    // Central Europe
    "Central Europe": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: -100, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Celtic heartland (e.g., Boii)
        { after: -100, before: 500, keys: ['PREHISTORIC_PROTO_GERMANIC', 'GERMAN'] }, // Germanic migrations
        { after: 500, before: 900, keys: ['SLAVIC_MEDIEVAL', 'FRANKISH_CAROLINGIAN', 'BOHEMIAN'] }, // Slavic migrations
        { after: 900, before: 1918, keys: ['GERMAN', 'BOHEMIAN', 'HUNGARIAN', 'POLISH'] },
        { after: 1918, keys: ['CZECH_MODERN', 'SLOVAK_MODERN', 'HUNGARIAN_MODERN', 'GERMAN'] }
    ],
    "Carpathian Foothills": [
        { before: -100, keys: ['PREHISTORIC_PROTO_CELTIC'] },
        { after: -100, before: 500, keys: ['PREHISTORIC_PROTO_GERMANIC', 'GERMAN'] },
        { after: 500, before: 900, keys: ['SLAVIC_MEDIEVAL'] },
        { after: 900, before: 1526, keys: ['HUNGARIAN', 'POLISH', 'TRANSYLVANIAN'] },
        { after: 1526, before: 1918, keys: ['HUNGARIAN', 'POLISH', 'TRANSYLVANIAN', 'ROMANIAN', 'GERMAN'] },
        { after: 1918, keys: ['HUNGARIAN_MODERN', 'POLISH_MODERN', 'SLOVAK_MODERN', 'ROMANIAN'] }
    ],
     "Transylvania": [
        { before: 100, keys: ['CELTIC_ANCIENT'] }, // Dacian/Celtic period
        { after: 100, before: 900, keys: ['SLAVIC_MEDIEVAL', 'GERMAN'] },
        { after: 900, before: 1918, keys: ['TRANSYLVANIAN', 'HUNGARIAN', 'ROMANIAN', 'GERMAN'] },
        { after: 1918, keys: ['ROMANIAN', 'HUNGARIAN_MODERN', 'GERMAN'] }
    ],
    // Balkans
    "Balkans": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Paleo-Balkan tribes (Illyrians, Thracians)
        { after: -400, before: 146, keys: ['ANCIENT_GREEK'] }, // Hellenistic influence
        { after: 146, before: 600, keys: ['ANCIENT_ROMAN', 'ANCIENT_GREEK'] },
        { after: 600, before: 1453, keys: ['BYZANTINE', 'SLAVIC_MEDIEVAL', 'SERBIAN', 'BULGARIAN', 'CROATIAN'] },
        { after: 1453, before: 1912, keys: ['TURKISH', 'GREEK', 'SERBIAN', 'BULGARIAN', 'CROATIAN', 'ROMANIAN'] },
        { after: 1912, before: 1991, keys: ['YUGOSLAV', 'GREEK', 'BULGARIAN', 'ROMANIAN'] },
        { after: 1991, keys: ['SERBIAN', 'CROATIAN', 'BULGARIAN', 'GREEK', 'ROMANIAN'] }
    ],
    "Croatia and Environs": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: -100, keys: ['PREHISTORIC_PROTO_CELTIC'] }, // Illyrian/Celtic tribes
        { after: -100, before: 395, keys: ['ANCIENT_ROMAN'] },
        { after: 395, before: 925, keys: ['SLAVIC_MEDIEVAL', 'BYZANTINE'] },
        { after: 925, before: 1527, keys: ['CROATIAN', 'HUNGARIAN'] },
        { after: 1527, before: 1918, keys: ['CROATIAN', 'HUNGARIAN', 'GERMAN'] },
        { after: 1918, before: 1991, keys: ['YUGOSLAV'] },
        { after: 1991, keys: ['CROATIAN'] }
    ],
    // Scandinavia
    "Scandinavia": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] }, // Nordic Bronze Age & Pre-Roman Iron Age
        { after: 200, before: 793, keys: ['SCANDINAVIAN'] }, // Proto-Norse / Migration Period
        { after: 793, before: 1100, keys: ['SCANDINAVIAN', 'ICELANDIC'] }, // Viking Age
        { after: 1100, keys: ['SCANDINAVIAN', 'ICELANDIC'] }
    ],
    // Atlantic Islands (Iceland, Faroe Islands, Azores, etc.)
    "Atlantic Islands": [
        { before: 870, keys: ['SCANDINAVIAN'] }, // Norse settlement of Iceland
        { after: 870, before: 1100, keys: ['SCANDINAVIAN', 'ICELANDIC'] }, // Viking Age
        { after: 1100, before: 1400, keys: ['ICELANDIC', 'SCANDINAVIAN'] }, // Medieval Iceland
        { after: 1400, keys: ['ICELANDIC', 'SCANDINAVIAN', 'IRISH', 'PORTUGUESE'] } // Later periods with diverse settlements
    ],
    // Eastern Europe
    "Eastern Europe": [
       { before: -100, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 500, keys: ['PREHISTORIC_PROTO_GERMANIC'] }, // Gothic and other East Germanic tribes
        { after: 500, before: 882, keys: ['SLAVIC_MEDIEVAL', 'SCANDINAVIAN', 'BYZANTINE'] },
        { after: 882, before: 1240, keys: ['RUSSIAN', 'SLAVIC_MEDIEVAL'] }, // Kievan Rus'
        { after: 1240, before: 1480, keys: ['RUSSIAN', 'MONGOLIAN_TRADITIONAL', 'TURKIC_STEPPE'] }, // Mongol Yoke
        { after: 1480, before: 1721, keys: ['RUSSIAN', 'POLISH'] },
        { after: 1721, keys: ['RUSSIAN', 'POLISH_MODERN', 'JEWISH_ASHKENAZI'] }
    ],
    // Low Countries
    "Low Countries": [
         { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: -58, keys: ['PREHISTORIC_PROTO_CELTIC', 'PREHISTORIC_PROTO_GERMANIC'] }, // Belgae tribes
        { after: -58, before: 486, keys: ['ANCIENT_ROMAN', 'GERMAN'] },
        { after: 486, before: 843, keys: ['FRANKISH_MEROVINGIAN', 'FRANKISH_CAROLINGIAN'] },
        { after: 843, before: 1581, keys: ['DUTCH', 'FRENCH', 'GERMAN'] },
        { after: 1581, keys: ['DUTCH', 'FRENCH'] }
    ],
    // Greece and Aegean
    "Greece and Aegean": [
        { before: -1200, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Represents pre-Mycenaean peoples
        { after: -1200, before: 146, keys: ['ANCIENT_GREEK'] }, // Mycenaean, Classical, Hellenistic
        { after: 146, before: 330, keys: ['ANCIENT_GREEK', 'ANCIENT_ROMAN'] },
        { after: 330, before: 1453, keys: ['BYZANTINE'] },
        { after: 1453, before: 1821, keys: ['GREEK', 'TURKISH', 'ITALIAN'] },
        { after: 1821, keys: ['GREEK'] }
    ],
    // Ural and Arctic Europe
    "Ural and Arctic Europe": [
         { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] }, // Replaces the generic 'EUROPEAN'
         { after: 200, before: 1200, keys: ['SCANDINAVIAN'] }, // Norse expansion
         { after: 1200, keys: ['RUSSIAN', 'SCANDINAVIAN'] }
    ],
    // European waters (Generic entry for naval encounters etc.)
    "European waters": [
        { before: 800, keys: ['ANCIENT_ROMAN', 'ANCIENT_GREEK', 'PREHISTORIC_PROTO_CELTIC'] },
        { after: 800, keys: ['SCANDINAVIAN', 'ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN', 'ITALIAN', 'GREEK'] }
    ]
},
    "NORTH_AMERICAN_PRE_COLUMBIAN": {
        // Pacific Coast & California
        "Pacific Coast": [
            { keys: ['PACIFIC_NORTHWEST', 'CALIFORNIA_NATIVE'] }
        ],
        "Northern California": [
            { keys: ['CALIFORNIA_NATIVE'] }
        ],
        "Central California Coast": [
            { keys: ['CALIFORNIA_NATIVE'] }
        ],
        "Southern California": [
            { keys: ['CALIFORNIA_NATIVE'] }
        ],
        // Southwest & Great Plains
        "Southwest": [
            { keys: ['PUEBLO', 'SOUTHWEST_NATIVE', 'APACHE'] }
        ],
        "Great Plains": [
            { keys: ['PLAINS_NATIVE', 'LAKOTA_SIOUX', 'APACHE'] }
        ],
        // East and Midwest
        "Mississippi Valley": [
            { keys: ['MISSISSIPPIAN', 'CREEK_MUSKOGEE', 'ALGONQUIAN'] }
        ],
        "Northeast Woodlands": [
            { keys: ['IROQUOIS_HAUDENOSAUNEE', 'ALGONQUIAN'] }
        ],
        "Southeast": [
            { keys: ['CHEROKEE', 'CREEK_MUSKOGEE', 'MISSISSIPPIAN'] }
        ],
        "Atlantic Coast": [
            { keys: ['ALGONQUIAN'] }
        ],
        // North
        "Arctic and Subarctic": [
            { keys: ['INUIT', 'SUBARCTIC_NATIVE'] }
        ],
        "Canada": [
            { keys: ['ALGONQUIAN', 'IROQUOIS_HAUDENOSAUNEE', 'INUIT'] }
        ],
        "Hudson Bay": [
            { keys: ['INUIT', 'SUBARCTIC_NATIVE'] }
        ],
        "Northwest Territory": [
            { keys: ['GREAT_BASIN_NATIVE', 'PLAINS_NATIVE'] }
        ],
        // Mexico & Central America
        "Mexico and Central Highlands": [
            { keys: ['AZTEC'] }
        ],
        "Valley of Mexico": [
            { keys: ['AZTEC'] }
        ],
        "Central America": [
            { keys: ['MAYA', 'MIXTEC', 'ZAPOTEC'] }
        ],
        "Mayan Lowlands": [
            { keys: ['MAYA'] }
        ],
        "Yucatán Peninsula": [
            { keys: ['MAYA'] }
        ],
        "Oaxaca Highlands": [
            { keys: ['ZAPOTEC', 'MIXTEC'] }
        ],
        "Mosquito Coast": [
            { keys: ['MAYA', 'CARIB'] }
        ],
        "Panama Isthmus": [
            { keys: ['MUISCA', 'CARIB'] }
        ],
        "The Caribbean": [
            { keys: ['TAINO', 'CARIB'] }
        ],
        "Greater Antilles": [
            { keys: ['TAINO'] }
        ],
        "Lesser Antilles": [
            { keys: ['CARIB'] }
        ]
    },
    "NORTH_AMERICAN": {
        // Pacific Coast & California
        "Pacific Coast": [
            { before: 1769, keys: ['PACIFIC_NORTHWEST', 'CALIFORNIA_NATIVE'] },
            { after: 1769, before: 1848, keys: ['PACIFIC_NORTHWEST', 'SPANISH_CASTILIAN', 'RUSSIAN'] },
            { after: 1848, keys: ['ENGLISH', 'CHINESE_CANTONESE', 'SPANISH_LATIN_AMERICAN', 'PACIFIC_NORTHWEST'] }
        ],
        "Northern California": [
            { before: 1769, keys: ['CALIFORNIA_NATIVE'] },
            { after: 1769, before: 1848, keys: ['SPANISH_CASTILIAN', 'RUSSIAN', 'CALIFORNIA_NATIVE'] },
            { after: 1848, keys: ['ENGLISH', 'TEXAS_ANGLO', 'CHINESE_CANTONESE', 'ITALIAN', 'SPANISH_LATIN_AMERICAN'] }
        ],
        "Central California Coast": [
            { before: 1769, keys: ['CALIFORNIA_NATIVE'] },
            { after: 1769, before: 1848, keys: ['SPANISH_CASTILIAN', 'CALIFORNIA_NATIVE'] },
            { after: 1848, keys: ['ENGLISH', 'TEXAS_ANGLO', 'PORTUGUESE', 'FILIPINO', 'SPANISH_LATIN_AMERICAN'] }
        ],
        "Southern California": [
            { before: 1769, keys: ['CALIFORNIA_NATIVE'] },
            { after: 1769, before: 1848, keys: ['SPANISH_CASTILIAN', 'AZTEC', 'CALIFORNIA_NATIVE'] },
            { after: 1848, keys: ['TEXAS_ANGLO', 'SPANISH_LATIN_AMERICAN', 'AFRICAN_AMERICAN', 'CHINESE_CANTONESE', 'JAPANESE', 'KOREAN'] }
        ],
        // Southwest & Great Plains
        "Southwest": [
            { before: 1540, keys: ['PUEBLO', 'SOUTHWEST_NATIVE', 'APACHE'] },
            { after: 1540, before: 1848, keys: ['TEXAS_SPANISH_COLONIAL', 'SPANISH_CASTILIAN', 'PUEBLO', 'APACHE'] },
            { after: 1848, keys: ['TEXAS_ANGLO', 'SPANISH_LATIN_AMERICAN', 'PUEBLO', 'APACHE'] }
        ],
        "Great Plains": [
            { before: 1700, keys: ['PLAINS_NATIVE', 'LAKOTA_SIOUX', 'APACHE'] },
            { after: 1700, before: 1860, keys: ['PLAINS_NATIVE', 'LAKOTA_SIOUX', 'FRENCH', 'SPANISH_LATIN_AMERICAN'] },
            { after: 1860, keys: ['TEXAS_ANGLO', 'GERMAN', 'SCANDINAVIAN', 'PLAINS_NATIVE', 'LAKOTA_SIOUX'] }
        ],
        // East and Midwest
        "Mississippi Valley": [
            { before: 1673, keys: ['MISSISSIPPIAN', 'CREEK_MUSKOGEE', 'ALGONQUIAN'] },
            { after: 1673, before: 1803, keys: ['FRENCH', 'CREEK_MUSKOGEE', 'SPANISH_CASTILIAN'] },
            { after: 1803, keys: ['NORTH_AMERICAN_COLONIAL', 'AFRICAN_AMERICAN', 'GERMAN', 'CELTIC_IRISH'] }
        ],
        "Northeast Woodlands": [
            { before: 1600, keys: ['IROQUOIS_HAUDENOSAUNEE', 'ALGONQUIAN'] },
            { after: 1600, before: 1783, keys: ['NORTH_AMERICAN_COLONIAL', 'FRENCH', 'DUTCH', 'IROQUOIS_HAUDENOSAUNEE'] },
            { after: 1783, keys: ['ENGLISH', 'FRENCH', 'GERMAN', 'CELTIC_IRISH', 'ITALIAN', 'POLISH'] }
        ],
        "Southeast": [
            { before: 1550, keys: ['CHEROKEE', 'CREEK_MUSKOGEE'] },
            { after: 1550, before: 1783, keys: ['SPANISH_CASTILIAN', 'ENGLISH', 'FRENCH', 'CHEROKEE'] },
            { after: 1783, keys: ['NORTH_AMERICAN_COLONIAL', 'AFRICAN_AMERICAN', 'ENGLISH', 'SCOTTISH'] }
        ],
        "Atlantic Coast": [
            { before: 1607, keys: ['ALGONQUIAN'] },
            { after: 1607, before: 1783, keys: ['NORTH_AMERICAN_COLONIAL', 'ENGLISH', 'DUTCH'] },
            { after: 1783, before: 1900, keys: ['ENGLISH', 'AFRICAN_AMERICAN', 'CELTIC_IRISH', 'GERMAN'] },
            { after: 1900, keys: ['ENGLISH', 'AFRICAN_AMERICAN', 'JEWISH_ASHKENAZI', 'ITALIAN', 'PUERTO_RICAN'] }
        ],
        // North
        "Arctic and Subarctic": [
            { before: 1730, keys: ['INUIT', 'ALGONQUIAN'] },
            { after: 1730, keys: ['INUIT', 'RUSSIAN', 'FRENCH', 'ENGLISH', 'SCANDINAVIAN'] }
        ],
        "Northern Rockies": [
            { before: 1805, keys: ['GREAT_BASIN_NATIVE', 'PLAINS_NATIVE'] },
            { after: 1805, keys: ['ENGLISH', 'SCANDINAVIAN', 'GERMAN', 'GREAT_BASIN_NATIVE'] }
        ],
        // Mexico & Central America
        "Mexico and Central Highlands": [
            { before: 1521, keys: ['AZTEC'] },
            { after: 1521, before: 1821, keys: ['SPANISH_CASTILIAN', 'AZTEC'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN'] }
        ],
        "Valley of Mexico": [
            { before: 1521, keys: ['AZTEC'] },
            { after: 1521, before: 1821, keys: ['SPANISH_CASTILIAN', 'AZTEC'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN'] }
        ],
        "Central America": [
            { before: 1520, keys: ['MAYA', 'MIXTEC', 'ZAPOTEC'] },
            { after: 1520, before: 1821, keys: ['SPANISH_CASTILIAN', 'MAYA'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN', 'MAYA', 'AFRICAN_AMERICAN'] }
        ],
        "Mayan Lowlands": [
            { before: 1520, keys: ['MAYA'] },
            { after: 1520, before: 1821, keys: ['SPANISH_CASTILIAN', 'MAYA'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN', 'MAYA'] }
        ],
        "Yucatán Peninsula": [
            { before: 1520, keys: ['MAYA'] },
            { after: 1520, before: 1821, keys: ['SPANISH_CASTILIAN', 'MAYA'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN', 'MAYA'] }
        ],
        "Oaxaca Highlands": [
            { before: 1521, keys: ['ZAPOTEC', 'MIXTEC'] },
            { after: 1521, before: 1821, keys: ['SPANISH_CASTILIAN', 'ZAPOTEC', 'MIXTEC'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN', 'ZAPOTEC', 'MIXTEC'] }
        ],
        "Mosquito Coast": [
            { before: 1630, keys: ['MAYA', 'CARIB'] },
            { after: 1630, before: 1860, keys: ['ENGLISH', 'CARIB', 'MAYA', 'AFRICAN_AMERICAN'] },
            { after: 1860, keys: ['SPANISH_LATIN_AMERICAN', 'ENGLISH', 'CARIB', 'AFRICAN_AMERICAN'] }
        ],
        "Panama Isthmus": [
            { before: 1510, keys: ['MUISCA', 'CARIB'] },
            { after: 1510, before: 1821, keys: ['SPANISH_CASTILIAN', 'AFRICAN_AMERICAN'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN', 'AFRICAN_AMERICAN', 'CHINESE_CANTONESE'] }
        ],
        "The Caribbean": [
            { before: 1492, keys: ['TAINO', 'CARIB'] },
            { after: 1492, before: 1898, keys: ['SPANISH_CASTILIAN', 'AFRICAN_AMERICAN', 'FRENCH', 'ENGLISH', 'DUTCH', 'TAINO'] },
            { after: 1898, keys: ['PUERTO_RICAN', 'SPANISH_LATIN_AMERICAN', 'AFRICAN_AMERICAN', 'ENGLISH', 'FRENCH'] }
        ],
        "Greater Antilles": [
            { before: 1492, keys: ['TAINO'] },
            { after: 1492, before: 1898, keys: ['SPANISH_CASTILIAN', 'AFRICAN_AMERICAN', 'TAINO'] },
            { after: 1898, keys: ['PUERTO_RICAN', 'SPANISH_LATIN_AMERICAN', 'AFRICAN_AMERICAN'] }
        ],
        "Lesser Antilles": [
            { before: 1492, keys: ['CARIB'] },
            { after: 1492, before: 1800, keys: ['FRENCH', 'ENGLISH', 'DUTCH', 'CARIB', 'AFRICAN_AMERICAN'] },
            { after: 1800, keys: ['ENGLISH', 'FRENCH', 'AFRICAN_AMERICAN', 'SPANISH_LATIN_AMERICAN'] }
        ]
    },
    "SOUTH_AMERICAN": {
        "Andes North": [
            { keys: ['INCA', 'MUISCA'] }
        ],
        "Andes South": [
            { keys: ['INCA', 'MAPUCHE'] }
        ],
        "Amazon Basin": [
            { keys: ['TUPI', 'GUARANI', 'INCA'] }
        ],
        "Gran Chaco and Pampas": [
            { keys: ['GUARANI', 'MAPUCHE'] }
        ],
        "Atlantic Coast": [
            { keys: ['TUPI', 'GUARANI'] }
        ],
        "Guiana Shield": [
            { keys: ['CARIB', 'TUPI', 'GUARANI'] }
        ],
        "Patagonia": [
            { keys: ['MAPUCHE'] }
        ],
        "Southern Highlands": [
            { keys: ['INCA'] }
        ],
        "Llanos and Orinoco": [
            { keys: ['MUISCA', 'CARIB'] }
        ]
    },
    "SOUTH_AMERICAN_COLONIAL": {
        "Andes North": [
            { before: 1533, keys: ['INCA', 'MUISCA'] },
            { after: 1533, before: 1820, keys: ['SPANISH_CASTILIAN', 'INCA', 'MUISCA'] },
            { after: 1820, keys: ['SPANISH_LATIN_AMERICAN', 'INCA', 'MUISCA'] }
        ],
        "Andes South": [
            { before: 1533, keys: ['INCA', 'MAPUCHE'] },
            { after: 1533, before: 1820, keys: ['SPANISH_CASTILIAN', 'INCA', 'MAPUCHE'] },
            { after: 1820, keys: ['SPANISH_LATIN_AMERICAN', 'GERMAN', 'ITALIAN', 'MAPUCHE', 'INCA'] }
        ],
        "Amazon Basin": [
            { before: 1541, keys: ['TUPI', 'GUARANI', 'INCA'] },
            { after: 1541, keys: ['PORTUGUESE_BRAZIL', 'SPANISH_LATIN_AMERICAN', 'TUPI', 'GUARANI'] }
        ],
        "Gran Chaco and Pampas": [
            { before: 1536, keys: ['GUARANI', 'MAPUCHE'] },
            { after: 1536, before: 1816, keys: ['SPANISH_CASTILIAN', 'GUARANI', 'MAPUCHE'] },
            { after: 1816, keys: ['SPANISH_LATIN_AMERICAN', 'ITALIAN', 'GERMAN', 'GUARANI'] }
        ],
        "Atlantic Coast": [
            { before: 1500, keys: ['TUPI', 'GUARANI'] },
            { after: 1500, before: 1822, keys: ['PORTUGUESE', 'AFRICAN_AMERICAN', 'TUPI', 'GUARANI', 'DUTCH'] },
            { after: 1822, keys: ['PORTUGUESE_BRAZIL', 'AFRICAN_AMERICAN', 'ITALIAN', 'GERMAN', 'JAPANESE'] }
        ],
        "Guiana Shield": [
            { before: 1600, keys: ['CARIB', 'TUPI', 'GUARANI'] },
            { after: 1600, keys: ['DUTCH', 'ENGLISH', 'FRENCH', 'AFRICAN_AMERICAN', 'HINDI', 'CARIB'] }
        ],
        "Patagonia": [
            { before: 1880, keys: ['MAPUCHE'] },
            { after: 1880, keys: ['SPANISH_LATIN_AMERICAN', 'WELSH', 'GERMAN', 'MAPUCHE'] }
        ],
        "Southern Highlands": [
            { before: 1538, keys: ['INCA'] },
            { after: 1538, before: 1825, keys: ['SPANISH_CASTILIAN', 'INCA'] },
            { after: 1825, keys: ['SPANISH_LATIN_AMERICAN', 'INCA'] }
        ],
        "Llanos and Orinoco": [
            { before: 1531, keys: ['MUISCA', 'CARIB'] },
            { after: 1531, before: 1811, keys: ['SPANISH_CASTILIAN', 'MUISCA'] },
            { after: 1811, keys: ['SPANISH_LATIN_AMERICAN'] }
        ]
    },
    "MENA": {
        "Nile Valley": [
            { before: 332, keys: ['PREHISTORIC_MENA'] },
            { after: 332, before: 641, keys: ['ANCIENT_GREEK', 'ANCIENT_ROMAN', 'EGYPTIAN_COPTIC'] },
            { after: 641, before: 1517, keys: ['ARABIC_LEVANT', 'EGYPTIAN_COPTIC'] },
            { after: 1517, before: 1882, keys: ['TURKISH', 'ARABIC_LEVANT', 'EGYPTIAN_COPTIC'] },
            { after: 1882, keys: ['ARABIC_LEVANT', 'EGYPTIAN_COPTIC', 'ENGLISH', 'FRENCH'] }
        ],
        "Nubian Corridor": [
            { before: 785, keys: ['NUBIAN', 'EGYPTIAN_COPTIC'] },
            { after: 785, keys: ['NUBIAN', 'ARABIAN_HEJAZ'] }
        ],
        "Levant": [
            { before: 332, keys: ['MESOPOTAMIAN_ANCIENT', 'HEBREW'] },
            { after: 332, before: 636, keys: ['ANCIENT_GREEK', 'ANCIENT_ROMAN', 'BYZANTINE', 'HEBREW'] },
            { after: 636, before: 1099, keys: ['ARABIC_LEVANT', 'LEVANTINE', 'BYZANTINE'] },
            { after: 1099, before: 1291, keys: ['LEVANTINE', 'ARABIC_LEVANT', 'FRENCH_MEDIEVAL', 'ITALIAN'] }, // Crusader period
            { after: 1291, before: 1918, keys: ['LEVANTINE', 'ARABIC_LEVANT', 'TURKISH',] },
            { after: 1918, keys: ['LEVANTINE', 'HEBREW', 'ARABIC_LEVANT'] }
        ],
        "Anatolia": [
            { before: 334, keys: ['PERSIAN_ANCIENT', 'ANCIENT_GREEK'] },
            { after: 334, before: 1071, keys: ['BYZANTINE', 'ARMENIAN', 'GEORGIAN'] },
            { after: 1071, before: 1453, keys: ['TURKIC_STEPPE', 'BYZANTINE', 'ARMENIAN', 'GREEK'] },
            { after: 1453, before: 1922, keys: ['TURKISH', 'ARMENIAN', 'GREEK', 'HEBREW'] },
            { after: 1922, keys: ['TURKISH'] }
        ],
        "Mesopotamia": [
            { before: 539, keys: ['MESOPOTAMIAN_ANCIENT'] },
            { after: 539, before: 633, keys: ['PERSIAN_ANCIENT', 'ANCIENT_GREEK'] },
            { after: 633, before: 1258, keys: ['ARABIAN_HEJAZ', 'PERSIAN_FARSI'] },
            { after: 1258, before: 1534, keys: ['MONGOLIAN_TRADITIONAL', 'TURKIC_STEPPE', 'PERSIAN_FARSI'] },
            { after: 1534, before: 1918, keys: ['TURKISH', 'ARABIC_LEVANT', 'PERSIAN_FARSI'] },
            { after: 1918, keys: ['ARABIC_LEVANT', 'PERSIAN_FARSI'] }
        ],
        "Maghreb": [
            { before: 146, keys: ['BERBER_AMAZIGH'] },
            { after: 146, before: 647, keys: ['ANCIENT_ROMAN', 'BERBER_AMAZIGH'] },
            { after: 647, before: 1500, keys: ['MAGHREBI', 'BERBER_AMAZIGH', 'ARABIAN_HEJAZ'] },
            { after: 1500, before: 1962, keys: ['MAGHREBI', 'BERBER_AMAZIGH', 'TURKISH', 'FRENCH', 'SPANISH_CASTILIAN'] },
            { after: 1962, keys: ['MAGHREBI', 'BERBER_AMAZIGH', 'FRENCH'] }
        ],
        "Arabian Peninsula": [
            { before: 622, keys: ['ARABIAN_HEJAZ', 'HEBREW'] },
            { after: 622, before: 1517, keys: ['ARABIAN_HEJAZ'] },
            { after: 1517, before: 1918, keys: ['ARABIAN_HEJAZ', 'TURKISH'] },
            { after: 1918, keys: ['ARABIAN_HEJAZ'] }
        ],
        "Hejaz Mountains": [
            { before: 1918, keys: ['ARABIAN_HEJAZ', 'TURKISH'] },
            { after: 1918, keys: ['ARABIAN_HEJAZ'] }
        ],
        "Persian Plateau": [
            { before: 651, keys: ['PERSIAN_ANCIENT', 'SOGDIAN'] },
            { after: 651, before: 1220, keys: ['PERSIAN_FARSI', 'PERSIAN_KHORASAN', 'ARABIAN_HEJAZ'] },
            { after: 1220, before: 1501, keys: ['PERSIAN_FARSI', 'MONGOLIAN_TRADITIONAL', 'TURKIC_STEPPE'] },
            { after: 1501, keys: ['PERSIAN_FARSI'] }
        ],
        "Caucasus": [
            { before: 600, keys: ['ARMENIAN', 'GEORGIAN', 'PERSIAN_ANCIENT', 'ANCIENT_ROMAN'] },
            { after: 600, before: 1800, keys: ['ARMENIAN', 'GEORGIAN', 'PERSIAN_FARSI', 'TURKISH'] },
            { after: 1800, keys: ['ARMENIAN', 'GEORGIAN', 'RUSSIAN'] }
        ]
    },
    "SUB_SAHARAN_AFRICAN": {
        "Sahel": [
            { before: 800, keys: ['WEST_AFRICAN_SAHEL'] },
            { after: 800, before: 1900, keys: ['WEST_AFRICAN_SAHEL', 'MAGHREBI'] },
            { after: 1900, keys: ['WEST_AFRICAN_SAHEL', 'FRENCH'] }
        ],
        "Upper Guinea": [
            { before: 1500, keys: ['YORUBA', 'WEST_AFRICAN_SAHEL'] },
            { after: 1500, before: 1960, keys: ['YORUBA', 'PORTUGUESE', 'ENGLISH', 'FRENCH'] },
            { after: 1960, keys: ['YORUBA', 'WEST_AFRICAN_SAHEL'] }
        ],
        "Lower Guinea and Congo Basin": [
            { before: 1480, keys: ['YORUBA', 'SUB_SAHARAN_AFRICAN'] },
            { after: 1480, before: 1960, keys: ['YORUBA', 'PORTUGUESE', 'FRENCH', 'DUTCH'] },
            { after: 1960, keys: ['YORUBA', 'FRENCH'] }
        ],
        "Horn of Africa": [
            { before: 1270, keys: ['ETHIOPIAN_HIGHLAND'] },
            { after: 1270, before: 1936, keys: ['AMHARIC', 'SWAHILI'] },
            { after: 1936, keys: ['AMHARIC', 'ITALIAN'] }
        ],
        "East African Rift": [
            { before: 700, keys: ['PREHISTORIC_AFRICAN'] },
            { after: 700, before: 1880, keys: ['SWAHILI', 'ARABIAN_HEJAZ', 'RWANDA_BURUNDI'] },
            { after: 1880, keys: ['SWAHILI', 'ENGLISH', 'GERMAN', 'HINDI'] }
        ],
        "Swahili Coast": [
            { before: 700, keys: ['SWAHILI'] },
            { after: 700, before: 1500, keys: ['SWAHILI', 'ARABIAN_HEJAZ', 'PERSIAN_FARSI'] },
            { after: 1500, before: 1960, keys: ['SWAHILI', 'PORTUGUESE', 'ARABIAN_HEJAZ', 'ENGLISH'] },
            { after: 1960, keys: ['SWAHILI'] }
        ],
        "Southern Africa": [
            { before: 1652, keys: ['ZULU', 'SUB_SAHARAN_AFRICAN'] },
            { after: 1652, before: 1994, keys: ['ZULU', 'DUTCH', 'ENGLISH', 'GERMAN'] },
            { after: 1994, keys: ['ZULU', 'ENGLISH', 'DUTCH'] }
        ],
        "Central Africa": [
            { before: 1870, keys: ['SUB_SAHARAN_AFRICAN', 'RWANDA_BURUNDI'] },
            { after: 1870, keys: ['FRENCH', 'PORTUGUESE', 'RWANDA_BURUNDI'] }
        ],
        "West African Forests": [
            { before: 1600, keys: ['YORUBA'] },
            { after: 1600, before: 1960, keys: ['YORUBA', 'ENGLISH', 'AFRICAN_AMERICAN'] },
            { after: 1960, keys: ['YORUBA'] }
        ],
        "Madagascar and Islands": [
            { before: 1000, keys: ['MALAGASY_SAKALAVA', 'SWAHILI'] },
            { after: 1000, before: 1817, keys: ['MALAGASY_SAKALAVA', 'MALAGASY_BETSILEO'] },
            { after: 1817, before: 1897, keys: ['MALAGASY_MERINA', 'MALAGASY_BETSILEO', 'MALAGASY_SAKALAVA'] },
            { after: 1897, keys: ['MALAGASY_MERINA', 'FRENCH'] }
        ]
    },
    "SOUTH_ASIAN": {
        "Indus Valley": [
            { before: 1206, keys: ['SANSKRIT_CLASSICAL', 'PUNJABI'] },
            { after: 1206, before: 1857, keys: ['PUNJABI', 'PERSIAN_FARSI', 'HINDI'] },
            { after: 1857, keys: ['PUNJABI', 'HINDI', 'ENGLISH'] }
        ],
        "Gangetic Plain": [
            { before: 1206, keys: ['SANSKRIT_CLASSICAL', 'HINDI'] },
            { after: 1206, before: 1857, keys: ['HINDI', 'PERSIAN_FARSI', 'RAJPUT'] },
            { after: 1857, keys: ['HINDI', 'BENGALI', 'ENGLISH'] }
        ],
        "Deccan Plateau": [
            { before: 1347, keys: ['DRAVIDIAN', 'TAMIL'] },
            { after: 1347, before: 1857, keys: ['TAMIL', 'DRAVIDIAN', 'HINDI', 'PERSIAN_FARSI'] },
            { after: 1857, keys: ['TAMIL', 'DRAVIDIAN', 'HINDI', 'ENGLISH'] }
        ],
        "Himalayas and Northeast": [
            { keys: ['SANSKRIT_CLASSICAL', 'HINDI', 'BENGALI', 'CHINESE_MANDARIN'] }
        ],
        "Central India": [
            { before: 1200, keys: ['SANSKRIT_CLASSICAL', 'DRAVIDIAN'] },
            { after: 1200, keys: ['HINDI', 'RAJPUT', 'BENGALI'] }
        ],
        "Sri Lanka": [
            { before: 1505, keys: ['DRAVIDIAN', 'TAMIL', 'SANSKRIT_CLASSICAL'] },
            { after: 1505, before: 1948, keys: ['TAMIL', 'PORTUGUESE', 'DUTCH', 'ENGLISH'] },
            { after: 1948, keys: ['TAMIL', 'ENGLISH'] }
        ],
        // Southeast Asia
        "Mainland Southeast Asia": [
            { before: 1000, keys: ['KHMER', 'BURMESE'] },
            { after: 1000, before: 1887, keys: ['KHMER', 'VIETNAMESE', 'THAI', 'BURMESE', 'MALAY'] },
            { after: 1887, keys: ['VIETNAMESE', 'THAI', 'KHMER', 'FRENCH', 'ENGLISH'] }
        ],
        "Indochina Interior": [
            { before: 1893, keys: ['THAI', 'KHMER', 'VIETNAMESE'] },
            { after: 1893, keys: ['THAI', 'FRENCH', 'VIETNAMESE'] }
        ],
        "Maritime Southeast Asia": [
           { before: 800, keys: ['INDONESIAN', 'VIETNAMESE'] },
            { before: 1300, keys: ['MALAY', 'INDONESIAN', 'DRAVIDIAN', 'VIETNAMESE'] },
            { after: 1300, before: 1945, keys: ['MALAY', 'INDONESIAN', 'ARABIC_TRADITIONAL', 'PORTUGUESE', 'DUTCH', 'ENGLISH'] },
            { after: 1945, keys: ['MALAY', 'INDONESIAN', 'CHINESE_CANTONESE'] }
        ],
        "Philippines": [
            { before: 1565, keys: ['MELANESIAN'] },
            { after: 1565, before: 1898, keys: ['FILIPINO', 'SPANISH_CASTILIAN'] },
            { after: 1898, keys: ['FILIPINO', 'ENGLISH', 'SPANISH_LATIN_AMERICAN', 'JAPANESE'] }
        ],
        "Taiwan and East China Sea": [
            { before: 1624, keys: ['CHINESE_CANTONESE', 'POLYNESIAN'] },
            { after: 1624, before: 1895, keys: ['CHINESE_CANTONESE', 'DUTCH'] },
            { after: 1895, before: 1945, keys: ['JAPANESE', 'CHINESE_MANDARIN'] },
            { after: 1945, keys: ['CHINESE_MANDARIN'] }
        ]
    },
    "EAST_ASIAN": {
        "Siberia": [
            { before: 1600, keys: ['PREHISTORIC_ASIAN', 'TURKIC_STEPPE'] },
            { after: 1600, keys: ['RUSSIAN'] }
        ],
        "Kazakh Steppes": [
            { before: 1200, keys: ['TURKIC_STEPPE', 'SOGDIAN', 'PERSIAN_KHORASAN'] },
            { after: 1200, before: 1850, keys: ['MONGOLIAN_TRADITIONAL', 'KAZAKH', 'TURKIC_STEPPE'] },
            { after: 1850, keys: ['KAZAKH', 'RUSSIAN'] }
        ],
        "Khorasan": [
            { before: 651, keys: ['PERSIAN_ANCIENT', 'SOGDIAN'] },
            { after: 651, before: 1220, keys: ['PERSIAN_KHORASAN', 'TURKIC_STEPPE'] },
            { after: 1220, keys: ['PERSIAN_KHORASAN', 'MONGOLIAN_TRADITIONAL', 'UZBEK'] }
        ],
        "Transoxiana": [
            { before: 712, keys: ['SOGDIAN', 'PERSIAN_ANCIENT'] },
            { after: 712, before: 1220, keys: ['PERSIAN_KHORASAN', 'SOGDIAN', 'TURKIC_STEPPE'] },
            { after: 1220, before: 1873, keys: ['UZBEK', 'MONGOLIAN_TRADITIONAL', 'PERSIAN_FARSI'] },
            { after: 1873, keys: ['UZBEK', 'KYRGYZ', 'RUSSIAN'] }
        ],
        "Central Asian Oases": [
            { before: 1220, keys: ['SOGDIAN', 'PERSIAN_KHORASAN', 'TURKIC_STEPPE'] },
            { after: 1220, before: 1873, keys: ['UZBEK', 'TURKMEN', 'MONGOLIAN_TRADITIONAL'] },
            { after: 1873, keys: ['UZBEK', 'TURKMEN', 'KYRGYZ', 'RUSSIAN'] }
        ],
        "Mongolia and Manchuria": [
            { before: 1206, keys: ['MONGOLIAN', 'TURKIC_STEPPE'] },
            { after: 1206, before: 1700, keys: ['MONGOLIAN', 'MONGOLIAN_TRADITIONAL'] },
            { after: 1700, keys: ['MONGOLIAN', 'CHINESE_MANDARIN'] }
        ],
        "North China Plain": [
            { before: 1279, keys: ['CHINESE_MANDARIN'] },
            { after: 1279, before: 1368, keys: ['MONGOLIAN_TRADITIONAL', 'CHINESE_MANDARIN'] }, // Yuan Dynasty
            { after: 1368, before: 1644, keys: ['CHINESE_MANDARIN'] }, // Ming Dynasty
            { after: 1644, before: 1912, keys: ['CHINESE_MANDARIN'] }, // Qing Dynasty (Manchu)
            { after: 1912, keys: ['CHINESE_MANDARIN'] }
        ],
        "South China": [
            { before: 1900, keys: ['CHINESE_CANTONESE', 'VIETNAMESE'] },
            { after: 1900, keys: ['CHINESE_CANTONESE', 'ENGLISH', 'PORTUGUESE'] }
        ],
        "West China and Tibet": [
            { keys: ['CHINESE_MANDARIN', 'PREHISTORIC_ASIAN'] }
        ],
        "Japan": [
            { keys: ['JAPANESE'] } // Relatively isolated
        ],
        "Korea": [
            { before: 668, keys: ['KOREAN_ANCIENT'] },
            { after: 668, before: 1910, keys: ['KOREAN'] },
            { after: 1910, before: 1945, keys: ['KOREAN', 'JAPANESE'] },
            { after: 1945, keys: ['KOREAN'] }
        ]
    },
    "OCEANIA": {
        // Australia
        "Australia – Southeast": [
            { before: 1788, keys: ['ABORIGINAL_AUSTRALIAN'] },
            { after: 1788, keys: ['ENGLISH', 'CELTIC_IRISH'] }
        ],
        "Australia – Outback and Center": [
            { before: 1870, keys: ['ABORIGINAL_AUSTRALIAN'] },
            { after: 1870, keys: ['ENGLISH', 'CELTIC_IRISH', 'ABORIGINAL_AUSTRALIAN'] }
        ],
        "Australia – North and Queensland": [
            { before: 1824, keys: ['ABORIGINAL_AUSTRALIAN'] },
            { after: 1824, keys: ['ENGLISH', 'CELTIC_IRISH', 'CHINESE_CANTONESE', 'MELANESIAN'] }
        ],
        "Australia – West and Desert": [
            { before: 1829, keys: ['ABORIGINAL_AUSTRALIAN'] },
            { after: 1829, keys: ['ENGLISH', 'CELTIC_IRISH'] }
        ],
        // Pacific Islands
        "New Zealand": [
            { before: 1840, keys: ['POLYNESIAN'] },
            { after: 1840, keys: ['ENGLISH', 'SCOTTISH', 'POLYNESIAN'] }
        ],
        "New Guinea and Melanesia": [
            { before: 1884, keys: ['MELANESIAN'] },
            { after: 1884, keys: ['MELANESIAN', 'ENGLISH', 'GERMAN', 'DUTCH'] }
        ],
        "Polynesia": [
            { before: 1767, keys: ['TAHITIAN', 'TONGAN', 'SAMOAN', 'POLYNESIAN'] },
            { after: 1767, keys: ['TAHITIAN', 'SAMOAN', 'TONGAN', 'FRENCH', 'ENGLISH', 'GERMAN'] }
        ],
        "Micronesia": [
            { before: 1668, keys: ['POLYNESIAN', 'MELANESIAN'] },
            { after: 1668, keys: ['SPANISH_CASTILIAN', 'GERMAN', 'JAPANESE', 'ENGLISH'] }
        ],
        "Hawaii and Central Pacific": [
            { before: 1778, keys: ['HAWAIIAN'] },
            { after: 1778, keys: ['HAWAIIAN', 'ENGLISH', 'CHINESE_CANTONESE', 'JAPANESE', 'PORTUGUESE', 'FILIPINO'] }
        ],
        "Indonesian and Melanesian Islands": [
            { before: 1512, keys: ['INDONESIAN', 'MALAY', 'MELANESIAN'] },
            { after: 1512, before: 1949, keys: ['INDONESIAN', 'MALAY', 'MELANESIAN', 'PORTUGUESE', 'DUTCH'] },
            { after: 1949, keys: ['INDONESIAN', 'MALAY'] }
        ],
        "Major Seas and Oceans": [
            { before: 1500, keys: ['POLYNESIAN', 'MELANESIAN', 'SWAHILI', 'ARABIAN_HEJAZ', 'CHINESE_CANTONESE'] },
            { after: 1500, keys: ['ENGLISH', 'SPANISH_CASTILIAN', 'PORTUGUESE', 'DUTCH', 'FRENCH', 'POLYNESIAN'] }
        ]
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
 * Mapping of continents to period-appropriate name groups
 */
const PERIOD_NAME_MAPPING: Record<string, Record<string, string[]>> = {
    'EUROPEAN': {
        'antiquity': ['ANCIENT_ROMAN', 'ANCIENT_GREEK', 'CELTIC_ANCIENT'],
        'early_medieval': ['ENGLISH_ANGLO_SAXON', 'FRANKISH_MEROVINGIAN', 'SCANDINAVIAN'],
        'high_medieval': ['ENGLISH_MEDIEVAL', 'FRENCH_MEDIEVAL', 'GERMAN', 'SCANDINAVIAN'],
        'late_medieval': ['ENGLISH_MEDIEVAL', 'FRENCH_MEDIEVAL', 'ITALIAN', 'SPANISH_CASTILIAN'],
        'renaissance': ['ITALIAN', 'FRENCH', 'ENGLISH', 'SPANISH_CASTILIAN'],
        'early_modern': ['ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN', 'GERMAN'],
        'industrial': ['ENGLISH', 'FRENCH', 'GERMAN', 'ITALIAN'],
        'modern': ['ENGLISH', 'FRENCH', 'GERMAN', 'ITALIAN', 'SPANISH_CASTILIAN']
    },
    'EAST_ASIAN': {
        'antiquity': ['CHINESE_MANDARIN', 'JAPANESE'],
        'early_medieval': ['CHINESE_MANDARIN', 'JAPANESE'],
        'high_medieval': ['CHINESE_MANDARIN', 'JAPANESE'],
        'late_medieval': ['CHINESE_MANDARIN', 'JAPANESE'],
        'renaissance': ['CHINESE_MANDARIN', 'JAPANESE'],
        'early_modern': ['CHINESE_MANDARIN', 'JAPANESE'],
        'industrial': ['CHINESE_MANDARIN', 'JAPANESE'],
        'modern': ['CHINESE_MANDARIN', 'JAPANESE', 'KOREAN']
    },
    'MENA': {
        'antiquity': ['EGYPTIAN_COPTIC', 'PERSIAN_ANCIENT', 'HEBREW'],
        'early_medieval': ['ARABIAN_HEJAZ', 'PERSIAN_FARSI', 'HEBREW'],
        'high_medieval': ['ARABIAN_HEJAZ', 'PERSIAN_FARSI', 'TURKISH'],
        'late_medieval': ['ARABIAN_HEJAZ', 'PERSIAN_FARSI', 'TURKISH', 'MAGHREBI'],
        'renaissance': ['TURKISH', 'PERSIAN_FARSI', 'ARABIAN_HEJAZ'],
        'early_modern': ['TURKISH', 'PERSIAN_FARSI', 'ARABIAN_HEJAZ'],
        'industrial': ['TURKISH', 'PERSIAN_FARSI', 'ARABIAN_HEJAZ'],
        'modern': ['ARABIAN_HEJAZ', 'PERSIAN_FARSI', 'TURKISH']
    },
    'SOUTH_ASIAN': {
        'antiquity': ['SANSKRIT_CLASSICAL', 'TAMIL'],
        'early_medieval': ['SANSKRIT_CLASSICAL', 'TAMIL', 'BENGALI'],
        'high_medieval': ['SANSKRIT_CLASSICAL', 'TAMIL', 'BENGALI', 'HINDI'],
        'late_medieval': ['PERSIAN_FARSI', 'SANSKRIT_CLASSICAL', 'TAMIL', 'BENGALI'],
        'renaissance': ['PERSIAN_FARSI', 'SANSKRIT_CLASSICAL', 'HINDI', 'BENGALI'],
        'early_modern': ['PERSIAN_FARSI', 'HINDI', 'BENGALI', 'TAMIL'],
        'industrial': ['ENGLISH', 'HINDI', 'BENGALI', 'TAMIL'],
        'modern': ['HINDI', 'BENGALI', 'TAMIL', 'PUNJABI']
    },
    'SUB_SAHARAN_AFRICAN': {
        'antiquity': ['NUBIAN', 'ETHIOPIAN_HIGHLAND'],
        'early_medieval': ['NUBIAN', 'ETHIOPIAN_HIGHLAND', 'SWAHILI'],
        'high_medieval': ['WEST_AFRICAN_SAHEL', 'SWAHILI', 'ETHIOPIAN_HIGHLAND'],
        'late_medieval': ['WEST_AFRICAN_SAHEL', 'SWAHILI', 'ETHIOPIAN_HIGHLAND'],
        'renaissance': ['WEST_AFRICAN_SAHEL', 'SWAHILI', 'ETHIOPIAN_HIGHLAND'],
        'early_modern': ['WEST_AFRICAN_SAHEL', 'SWAHILI', 'ETHIOPIAN_HIGHLAND'],
        'industrial': ['WEST_AFRICAN_SAHEL', 'SWAHILI', 'ETHIOPIAN_HIGHLAND'],
        'modern': ['WEST_AFRICAN_SAHEL', 'SWAHILI', 'ETHIOPIAN_HIGHLAND', 'ENGLISH', 'FRENCH']
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
        'antiquity': ['AZTEC', 'INUIT'],
        'early_medieval': ['AZTEC', 'INUIT', 'ALGONQUIAN'],
        'high_medieval': ['AZTEC', 'INUIT', 'ALGONQUIAN'],
        'late_medieval': ['AZTEC', 'INUIT', 'ALGONQUIAN'],
        'renaissance': ['AZTEC', 'INUIT', 'ALGONQUIAN'],
        'early_modern': ['AZTEC', 'INUIT', 'ALGONQUIAN', 'ENGLISH', 'FRENCH'],
        'industrial': ['ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN'],
        'modern': ['ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN']
    },
    'SOUTH_AMERICAN': {
        'antiquity': ['ANDEAN_QUECHUA', 'TUPI'],
        'early_medieval': ['ANDEAN_QUECHUA', 'TUPI'],
        'high_medieval': ['ANDEAN_QUECHUA', 'TUPI'],
        'late_medieval': ['ANDEAN_QUECHUA', 'TUPI'],
        'renaissance': ['ANDEAN_QUECHUA', 'TUPI', 'SPANISH_CASTILIAN', 'PORTUGUESE'],
        'early_modern': ['SPANISH_CASTILIAN', 'PORTUGUESE', 'ANDEAN_QUECHUA'],
        'industrial': ['SPANISH_CASTILIAN', 'PORTUGUESE'],
        'modern': ['SPANISH_CASTILIAN', 'PORTUGUESE']
    },
    'OCEANIA': {
        'antiquity': ['POLYNESIAN', 'MELANESIAN'],
        'early_medieval': ['POLYNESIAN', 'MELANESIAN'],
        'high_medieval': ['POLYNESIAN', 'MELANESIAN'],
        'late_medieval': ['POLYNESIAN', 'MELANESIAN'],
        'renaissance': ['POLYNESIAN', 'MELANESIAN'],
        'early_modern': ['POLYNESIAN', 'MELANESIAN', 'ENGLISH'],
        'industrial': ['ENGLISH', 'POLYNESIAN', 'MELANESIAN'],
        'modern': ['ENGLISH', 'POLYNESIAN', 'MELANESIAN']
    }
};

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
                ['ANCIENT_GREEK', 'ANCIENT_ROMAN', 'FRANKISH_MEROVINGIAN', 'FRANKISH_CAROLINGIAN', 'NORMAN_FRENCH', 'FRENCH_MEDIEVAL', 'ENGLISH_ANGLO_SAXON', 'ENGLISH_MEDIEVAL', 'ENGLISH', 'SPANISH_CASTILIAN', 'PORTUGUESE', 'ITALIAN', 'FRENCH', 'GERMAN', 'RUSSIAN', 'GREEK', 'CELTIC_IRISH', 'WELSH', 'SCOTTISH', 'DUTCH', 'SCANDINAVIAN', 'BYZANTINE', 'SLAVIC_MEDIEVAL', 'HUNGARIAN', 'POLISH', 'CZECH', 'ROMANIAN', 'BULGARIAN', 'SERBIAN', 'CROATIAN', 'ICELANDIC', 'BOHEMIAN', 'ARMENIAN', 'GEORGIAN', 'EUROPEAN'].includes(g)
            );
        case 'EAST_ASIAN':
            return groups.filter(g => 
                ['JAPANESE', 'CHINESE_MANDARIN', 'CHINESE_CANTONESE', 'KOREAN', 'KOREAN_ANCIENT', 'VIETNAMESE', 'THAI', 'BURMESE', 'KHMER', 'MALAY', 'INDONESIAN', 'MONGOLIAN_TRADITIONAL', 'KAZAKH', 'UZBEK', 'KYRGYZ', 'TURKMEN', 'EAST_ASIAN'].includes(g)
            );
        case 'MENA':
            return groups.filter(g => 
                ['ARABIC_LEVANT', 'PERSIAN_FARSI', 'TURKISH', 'HEBREW', 'BERBER_AMAZIGH', 'ARABIC_TRADITIONAL', 'MENA'].includes(g)
            );
        case 'SOUTH_ASIAN':
            return groups.filter(g => 
                ['HINDI', 'BENGALI', 'TAMIL', 'PUNJABI', 'SOUTH_ASIAN'].includes(g)
            );
        case 'SUB_SAHARAN_AFRICAN':
            return groups.filter(g => 
                ['YORUBA', 'SWAHILI', 'AMHARIC', 'ZULU', 'MALAGASY_MERINA', 'MALAGASY_BETSILEO', 'MALAGASY_SAKALAVA', 'SUB_SAHARAN_AFRICAN'].includes(g)
            );
        case 'OCEANIA':
            return groups.filter(g => 
                ['POLYNESIAN', 'MELANESIAN', 'ABORIGINAL_AUSTRALIAN', 'HAWAIIAN', 'TAHITIAN', 'SAMOAN', 'TONGAN', 'FIJIAN', 'OCEANIA'].includes(g)
            );
        case 'SOUTH_AMERICAN':
            return groups.filter(g => 
                ['ANDEAN_QUECHUA', 'GUARANI', 'SOUTH_AMERICAN', 'SPANISH_LATIN_AMERICAN', 'PORTUGUESE_BRAZIL'].includes(g)
            );
        case 'NORTH_AMERICAN_PRE_COLUMBIAN':
            return groups.filter(g => 
                ['NORTH_AMERICAN_ALGONQUIAN', 'IROQUOIAN', 'IROQUOIS_HAUDENOSAUNEE', 'PUEBLO', 'PLAINS_NATIVE', 'APACHE', 'CHEROKEE', 'LAKOTA_SIOUX', 'NORTH_AMERICAN_PRE_COLUMBIAN'].includes(g)
            );
        case 'NORTH_AMERICAN_COLONIAL':
            return groups.filter(g => 
                ['NORTH_AMERICAN_COLONIAL', 'ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN', 'DUTCH'].includes(g)
            );
        default:
            return groups;
    }
}