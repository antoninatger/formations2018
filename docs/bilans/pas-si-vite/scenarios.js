/* ═══════════════════════════════════════════════════════════════════════
   « Pas si vite ! » — les conversations (25/09/2026, relues le même jour)
   Une conversation = un copain qui s'est fait avoir, une image tirée de la
   médiathèque du cours « Fake News et esprit critique », et ce qu'il faut
   lui expliquer. FR et EN côte à côte dans chaque champ.

   Typographie : on écrit ici avec l'apostrophe droite et une espace simple
   avant ! ? ; : — jeu.js pose l'apostrophe courbe et l'espace fine
   insécable à l'affichage.

   Niveau « réponse libre » : `idees` liste les idées acceptées. Une idée est
   reconnue dès qu'UN de ses mots-clés apparaît dans la réponse (fautes de
   frappe tolérées, voir analyse.js). Les mots sont des débuts de mots :
   « recadr » reconnaît recadré, recadrée, recadrage… Un mot de 3 lettres
   ou moins, ou terminé par « $ », doit être un mot entier (« ia », « jt$ »).
   Règle d'or : un mot-clé ne doit PAS pouvoir valider l'erreur du copain
   (« c'est triste », « il a pas de tête », « y a la date »…).
   `contre` : ce qu'il ne faut PAS conclure (ignoré s'il est nié, ou
   introduit par « si » : « vérifie si c'est de l'IA »).
   ═══════════════════════════════════════════════════════════════════════ */
window.PSV_SCENARIOS = [
  {
    id: 'cadrage',
    ami: { nom: 'Lucas', avatar: '😎', couleur: '#1f8fd6' },
    heure: '17:42',
    messages: [
      { fr: 'MDR regarde le prince William 😂', en: 'LOL look at Prince William 😂' },
      { image: 'images/cadrage-doigt.jpg', alt: { fr: "Photo du prince William vu de dos et de côté, main levée : il semble faire un doigt d'honneur.", en: 'Photo of Prince William seen from behind and from the side, hand raised: he seems to be giving the middle finger.' } },
      { fr: "Il fait un doigt d'honneur aux photographes 😱 c'est un scandale !", en: "He's flipping off the photographers 😱 what a scandal!" }
    ],
    question: { fr: 'Lucas en est sûr. Que lui réponds-tu ?', en: 'Lucas is sure of it. What do you reply?' },
    qcm: [
      { bonne: true, fr: "Attends, c'est peut-être l'angle de la photo qui trompe : il faut voir d'autres photos du même moment.", en: 'Wait, the camera angle may be misleading: look at other photos of the same moment.' },
      { fr: "C'est sûrement un montage, quelqu'un a dû ajouter le doigt avec Photoshop.", en: 'It must be edited, someone probably added the finger with Photoshop.',
        retour: { fr: "Rien n'indique un montage : c'est une vraie photo. Le piège est ailleurs, dans ce qu'elle montre… et ce qu'elle cache.", en: 'Nothing suggests editing: it is a real photo. The trap is elsewhere, in what it shows… and what it hides.' } },
      { fr: "C'est une photo, donc c'est forcément vrai.", en: "It's a photo, so it must be true.",
        retour: { fr: "Une vraie photo peut tromper : tout dépend de l'angle et de ce qu'on choisit de montrer.", en: 'A real photo can mislead: it all depends on the angle and on what is shown.' } }
    ],
    idees: [
      { nom: { fr: "l'angle de la photo trompe", en: 'the camera angle is misleading' },
        mots: ['angle', 'point de vue', 'de dos', 'de cote', 'de profil', 'perspective', 'cadr', 'recadr', 'coupe', 'decoup', 'hors champ', 'entier', 'entiere', 'on voit pas', 'on ne voit pas', 'cache', 'partie', 'viewpoint', 'point of view', 'from behind', 'side', 'crop', 'frame', 'full picture', 'whole picture'] },
      { nom: { fr: "il faut voir d'autres images du même moment", en: 'look at other shots of the same moment' },
        mots: ['contexte', 'autre photo', 'autres photos', 'autre image', 'autres images', 'video', 'compt', 'trois', '3', 'troisieme', 'context', 'other photo', 'other picture', 'other shot', 'count', 'three', 'third'] }
    ],
    contre: { mots: ['montage', 'photoshop', 'truqu', 'retouch', 'edited', 'photoshopped'],
      retour: { fr: "Ce n'est pas un montage : la photo est vraie. C'est l'angle de prise de vue qui trompe.", en: "It isn't edited: the photo is real. It's the camera angle that misleads." } },
    indice: { fr: "D'où la photo a-t-elle été prise ? Voit-on vraiment toute sa main ?", en: 'Where was the photo taken from? Can you really see his whole hand?' },
    modele: { fr: "Attention, la photo est prise sous un angle trompeur : sur une autre photo du même moment, il compte juste sur ses doigts.", en: 'Careful, the photo was taken from a misleading angle: in another shot of the same moment he is just counting on his fingers.' },
    explication: { fr: "Ce n'est pas un montage : c'est une vraie photo, mais <b>prise sous un angle trompeur</b>. Ce jour-là (avril 2018, naissance de son troisième enfant), le prince William levait <b>trois doigts</b>, sans doute pour dire « trois ». Vu de dos et de côté, on ne voit que le majeur. Une autre photo, prise de face au même moment, montre la vérité. C'est le <b>piège du cadrage</b> : ce qu'on choisit de montrer, ou de cacher, change le sens d'une image.",
      en: "It isn't a fake: it's a real photo, but <b>taken from a misleading angle</b>. That day (April 2018, the birth of his third child), Prince William was holding up <b>three fingers</b>, probably to say “three”. Seen from behind and from the side, only the middle finger shows. Another photo, taken from the front at the same moment, shows the truth. That is the <b>framing trap</b>: what you choose to show, or hide, changes what an image means." },
    revelation: { image: 'images/cadrage-entier.jpg', alt: { fr: 'Une autre photo du même moment, prise de face : le prince William lève trois doigts.', en: 'Another photo of the same moment, taken from the front: Prince William holds up three fingers.' },
      legende: { fr: 'Une autre photo, prise au même moment sous un autre angle.', en: 'Another photo, taken at the same moment from another angle.' } },
    reflexe: { fr: "Avant de juger une photo, cherche d'autres images du même moment, prises sous d'autres angles.", en: 'Before judging a photo, look for other pictures of the same moment, taken from other angles.' },
    merci: { fr: "J'ai cherché d'autres photos… il compte juste sur ses doigts 😅 j'allais l'envoyer à toute la classe.", en: "I looked for other photos… he's just counting on his fingers 😅 I was about to send it to the whole class." }
  },

  {
    id: 'alien',
    ami: { nom: 'Inès', avatar: '🌸', couleur: '#d64d93' },
    heure: '20:15',
    messages: [
      { fr: 'REGARDE ÇA 👽👽👽', en: 'LOOK AT THIS 👽👽👽' },
      { image: 'images/alien.jpg', alt: { fr: "Image d'Emmanuel Macron serrant la main d'un extraterrestre, dans un salon doré présenté comme l'Élysée.", en: 'Image of Emmanuel Macron shaking hands with an alien, in a gilded room presented as the Élysée Palace.' } },
      { fr: "Macron a serré la main d'un alien à l'Élysée !! C'est dingue que personne en parle", en: 'Macron shook hands with an alien at the Élysée!! Crazy that nobody talks about it' }
    ],
    question: { fr: 'Inès est très sérieuse. Que lui réponds-tu ?', en: 'Inès is dead serious. What do you reply?' },
    qcm: [
      { bonne: true, fr: "C'est sûrement une image fabriquée par une IA. Si c'était vrai, tous les médias en parleraient.", en: "It's probably an AI-made image. If it were true, every news outlet would cover it." },
      { fr: "Wow, il faut vite le partager avant que le gouvernement le fasse supprimer !", en: 'Wow, we have to share it fast before the government gets it deleted!',
        retour: { fr: "Partager avant de vérifier, c'est comme ça qu'une fausse info fait le tour du monde. Et « on va nous le cacher » est un argument classique des fausses infos.", en: 'Sharing before checking is exactly how fake news goes round the world. And “they will hide it from us” is a classic fake-news line.' } },
      { fr: "C'est faux, les aliens n'aiment pas la politique.", en: "It's fake, aliens don't like politics.",
        retour: { fr: "C'est drôle, mais ce n'est pas une raison : on ne vérifie rien comme ça.", en: "Funny, but that's no reason: you haven't checked anything." } }
    ],
    idees: [
      { nom: { fr: "c'est une image générée par IA", en: 'it is an AI-generated image' },
        mots: ['ia', 'i a', 'intelligence artificielle', 'artificiel', 'genere', 'generee', 'midjourney', 'chatgpt', 'montage', 'photoshop', 'truqu', 'fabriqu', 'retouch', 'ai', 'generated', 'edited', 'photoshopped'] },
      { nom: { fr: "aucun média sérieux n'en parle", en: 'no serious outlet reports it' },
        mots: ['media', 'journal', 'journaux', 'presse', 'tele$', 'television', 'aux infos', 'dans les infos', 'jt$', 'actu', 'bfm', 'reportage', 'personne en parle', 'personne n en parle', 'source', 'officiel', 'news', 'press', 'nobody', 'official'] },
      { nom: { fr: 'une info extraordinaire demande des preuves', en: 'an extraordinary claim needs proof' },
        mots: ['preuve', 'prouv', 'verifi', 'impossible', 'proof', 'evidence', 'check'] }
    ],
    indice: { fr: "Comment une image aussi réaliste peut-elle être fabriquée aujourd'hui ? Et qui devrait en parler si c'était vrai ?", en: 'How can such a realistic image be made today? And who would be reporting it if it were true?' },
    modele: { fr: "C'est une image faite par une IA : une nouvelle pareille serait dans tous les médias.", en: "It's an AI image: news like that would be in every outlet." },
    explication: { fr: "C'est une <b>image générée par intelligence artificielle</b>. Aujourd'hui, n'importe qui peut fabriquer une photo réaliste en tapant une phrase. Un indice simple : une nouvelle aussi énorme ferait la une de <b>tous les médias</b>. Si aucun média sérieux n'en parle, c'est qu'il y a un problème.",
      en: 'This is an <b>AI-generated image</b>. Today anyone can create a realistic photo by typing a sentence. A simple clue: news this huge would be on the front page of <b>every outlet</b>. If no serious outlet reports it, something is wrong.' },
    reflexe: { fr: "Plus une info est incroyable, plus il faut de preuves : cherche si des médias sérieux en parlent.", en: 'The more incredible the news, the more proof it needs: check whether serious outlets report it.' },
    merci: { fr: "Ok je me suis fait avoir 😭 elle a l'air tellement vraie…", en: 'Ok I got fooled 😭 it looks so real…' }
  },

  {
    id: 'foule',
    ami: { nom: 'Théo', avatar: '🎮', couleur: '#9c5bd1' },
    heure: '19:03',
    messages: [
      { fr: "Mon grand frère m'a montré ça 😡", en: 'My big brother showed me this 😡' },
      { image: 'images/foule.jpg', alt: { fr: "Capture d'un tweet daté du 15 mars 2020 : une immense foule autour de l'Arc de Triomphe, avec le texte « Sérieusement ?! ».", en: 'Screenshot of a tweet dated 15 March 2020: a huge crowd around the Arc de Triomphe, with the text “Seriously?!”.' } },
      { fr: "En mars 2020, au début du Covid, des milliers de gens faisaient la fête sur les Champs-Élysées alors qu'on nous disait de rester chez nous !!", en: 'In March 2020, at the start of Covid, thousands of people were partying on the Champs-Élysées while we were told to stay home!!' }
    ],
    question: { fr: 'Théo est furieux. Que lui réponds-tu ?', en: 'Théo is furious. What do you reply?' },
    qcm: [
      { bonne: true, fr: "La photo est peut-être plus ancienne : vérifie quand elle a été prise, avec une recherche d'image inversée.", en: 'The photo may be older: check when it was taken, with a reverse image search.' },
      { fr: "C'est forcément vrai, la date du 15 mars 2020 est écrite juste en dessous de la photo.", en: 'It must be true, the date 15 March 2020 is written right under the photo.',
        retour: { fr: "Cette date est celle du tweet, pas celle de la photo. On peut republier une vieille photo n'importe quand.", en: 'That is the date of the tweet, not of the photo. An old photo can be reposted at any time.' } },
      { fr: 'Les Parisiens font toujours la fête, de toute façon.', en: 'Parisians are always partying anyway.',
        retour: { fr: "C'est un cliché, pas une vérification : ça ne dit rien sur cette photo.", en: "That's a cliché, not a check: it says nothing about this photo." } }
    ],
    idees: [
      { nom: { fr: 'la photo est plus ancienne', en: 'the photo is older' },
        mots: ['ancien', 'vieille', 'vieux', '2018', 'plus tot', 'autre annee', 'avant le confinement', 'avant le covid', 'republi', 'repost', 'pas recente', 'pas de 2020', 'date du tweet', 'date de publication', 'arbre', 'feuille', 'en ete', 'l ete', 'old', 'older', 'earlier', 'reposted', 'trees', 'leaves', 'summer'] },
      { nom: { fr: 'elle est sortie de son contexte', en: 'it is out of context' },
        mots: ['contexte', 'coupe du monde', 'foot', 'match', 'victoire', 'celebr', 'drapeau', 'bleus$', 'maillot', 'context', 'world cup', 'football', 'victory', 'flags'] },
      { nom: { fr: "une recherche d'image inversée retrouve l'origine", en: 'a reverse image search finds the source' },
        mots: ['recherche inversee', 'recherche d image', 'image inversee', 'google lens', 'lens$', 'tineye', 'inversee', 'reverse', 'origine', 'source', 'origin'] }
    ],
    indice: { fr: "La date sous le tweet est-elle forcément celle de la photo ? Regarde aussi les arbres et les drapeaux.", en: 'Is the date under the tweet necessarily the date of the photo? Look at the trees and the flags too.' },
    modele: { fr: "C'est une vieille photo sortie de son contexte : une recherche d'image inversée montre qu'elle date de la Coupe du monde 2018.", en: "It's an old photo out of context: a reverse image search shows it's from the 2018 World Cup." },
    explication: { fr: "Cette photo n'a rien à voir avec le Covid : elle montre la foule qui fête la <b>victoire de la France à la Coupe du monde de football, en juillet 2018</b>. Elle a été republiée le 15 mars 2020, deux jours avant le confinement, comme si elle venait d'être prise. La date sous le tweet est celle de la publication, pas celle de la photo. Un indice se voyait pourtant : en mars, les arbres de Paris n'ont pas encore de feuilles ! Une <b>recherche d'image inversée</b> (Google Lens, TinEye) retrouve l'origine en quelques secondes.",
      en: 'This photo has nothing to do with Covid: it shows the crowd celebrating <b>France winning the football World Cup in July 2018</b>. It was reposted on 15 March 2020, two days before lockdown, as if it had just been taken. The date under the tweet is when it was posted, not when the photo was taken. There was a clue: in March, the trees in Paris have no leaves yet! A <b>reverse image search</b> (Google Lens, TinEye) finds the source in seconds.' },
    reflexe: { fr: "Une photo peut être vraie… mais pas d'aujourd'hui. Vérifie d'où et de quand elle vient.", en: 'A photo can be real… but not from today. Check where and when it comes from.' },
    merci: { fr: "J'ai fait la recherche… c'était la Coupe du monde 2018 ?! Et je l'ai déjà envoyée à mes cousins 🙈", en: 'I did the search… it was the 2018 World Cup?! And I already sent it to my cousins 🙈' }
  },

  {
    id: 'mars',
    ami: { nom: 'Léa', avatar: '🎨', couleur: '#e0922a' },
    heure: '16:28',
    messages: [
      { fr: "Tu savais qu'il y a un visage sculpté sur Mars ?? 😮", en: "Did you know there's a carved face on Mars?? 😮" },
      { image: 'images/mars-1976.jpg', alt: { fr: 'Photo floue en noir et blanc du sol de Mars, où des ombres dessinent comme un visage.', en: 'Blurry black-and-white photo of the Martian surface where shadows look like a face.' } },
      { fr: "C'est la NASA qui l'a photographié ! C'est la preuve qu'il y avait des extraterrestres", en: 'NASA took the picture! That proves there were aliens' }
    ],
    question: { fr: "Léa n'en revient pas. Que lui réponds-tu ?", en: "Léa can't believe it. What do you reply?" },
    qcm: [
      { bonne: true, fr: "Notre cerveau voit des visages partout : avec une photo plus nette, c'est sûrement juste une colline.", en: 'Our brain sees faces everywhere: with a sharper photo, it is probably just a hill.' },
      { fr: "Si c'est la NASA qui l'a photographié, c'est forcément un vrai visage.", en: "If NASA photographed it, it must be a real face.",
        retour: { fr: "La NASA a pris la photo, mais c'est notre cerveau qui y voit un visage. Dès 1976, la NASA expliquait que c'était un jeu d'ombres.", en: 'NASA took the photo, but it is our brain that sees a face. As early as 1976, NASA explained it was a trick of shadows.' } },
      { fr: 'De toute façon, les photos de la NASA sont truquées.', en: 'Anyway, NASA photos are all faked.',
        retour: { fr: "Dire que tout est truqué, ce n'est pas vérifier. Ici la photo est vraie : c'est notre cerveau qui y voit un visage.", en: "Saying everything is faked isn't checking. This photo is real: it's our brain that sees a face." } }
    ],
    idees: [
      { nom: { fr: 'notre cerveau voit des visages partout (paréidolie)', en: 'our brain sees faces everywhere (pareidolia)' },
        mots: ['pareidol', 'cerveau', 'forme', 'imagination', 'on imagine', 'tu imagines', 'illusion', 'ombre', 'lumiere', 'on croit voir', 'visages partout', 'nuage', 'hasard', 'brain', 'shape', 'shadow', 'light', 'clouds', 'coincidence'] },
      { nom: { fr: 'une photo plus nette montre autre chose', en: 'a sharper photo shows something else' },
        mots: ['resolution', 'nette', 'net', 'flou', 'floue', 'pixel', 'qualite', 'nouvelle photo', 'autre photo', 'meilleure photo', 'zoom', 'sharper', 'blurry', 'quality', 'better photo', 'new photo'] },
      { nom: { fr: "c'est un relief naturel", en: 'it is a natural landform' },
        mots: ['colline', 'montagne', 'rocher', 'caillou', 'relief', 'naturel', 'roche', 'hill', 'mountain', 'rock', 'natural', 'mesa'] }
    ],
    indice: { fr: 'Pense aux formes que tu vois parfois dans les nuages… et à la qualité de cette photo.', en: 'Think of the shapes you sometimes see in clouds… and at the quality of this photo.' },
    modele: { fr: "C'est notre cerveau qui voit un visage (la paréidolie) : une photo plus nette montre une simple colline.", en: 'It is our brain seeing a face (pareidolia): a sharper photo shows a plain hill.' },
    explication: { fr: "En 1976, la sonde <b>Viking 1</b> photographie une colline de Mars : l'image est floue, les ombres font croire à un visage. En 2001, la sonde Mars Global Surveyor prend une <b>photo bien plus nette</b> : c'est… une simple colline. Notre cerveau est programmé pour reconnaître des visages partout, dans les nuages, les prises électriques ou les façades : c'est la <b>paréidolie</b>.",
      en: 'In 1976 the <b>Viking 1</b> probe photographed a hill on Mars: the image was blurry and the shadows looked like a face. In 2001 the Mars Global Surveyor probe took a <b>much sharper photo</b>: it is… a plain hill. Our brain is wired to spot faces everywhere, in clouds, power sockets or buildings: that is <b>pareidolia</b>.' },
    revelation: { image: 'images/mars-2001.jpg', alt: { fr: 'La même colline de Mars photographiée nettement en 2001 : aucun visage, un simple relief.', en: 'The same Martian hill photographed sharply in 2001: no face, just a landform.' },
      legende: { fr: 'La même colline, photographiée en 2001.', en: 'The same hill, photographed in 2001.' } },
    reflexe: { fr: "Quand on « voit » quelque chose dans une image floue, on cherche une meilleure image avant de conclure.", en: 'When you “see” something in a blurry image, look for a better one before concluding.' },
    merci: { fr: "J'ai trouvé la photo de 2001… c'est juste un caillou géant 😂", en: "I found the 2001 photo… it's just a giant rock 😂" }
  },

  {
    id: 'colis',
    ami: { nom: 'Sami', avatar: '⚽', couleur: '#06a880' },
    heure: '22:31',
    messages: [
      { fr: "J'ai reçu ce mail 📦", en: 'I got this email 📦' },
      { image: 'images/colis.jpg', alt: { fr: "Capture d'un e-mail aux couleurs de Mondial Relay : « Votre colis a été conservé », un texte plein de fautes et un bouton « Suivre mon colis ».", en: 'Screenshot of an email dressed up as Mondial Relay: “Your parcel has been held”, a text full of mistakes and a “Track my parcel” button.' } },
      { fr: "Mon colis est bloqué, il faut que je clique pour le récupérer. Bizarre, j'ai rien commandé… je clique ?", en: "My parcel is stuck, I have to click to get it. Weird, I didn't order anything… should I click?" }
    ],
    question: { fr: 'Sami hésite. Que lui réponds-tu ?', en: 'Sami is hesitating. What do you reply?' },
    qcm: [
      { bonne: true, fr: "Ne clique pas, c'est sûrement une arnaque : tu n'as rien commandé, et le message est plein de fautes.", en: "Don't click, it's probably a scam: you didn't order anything, and the message is full of mistakes." },
      { fr: "Clique vite, sinon ton colis risque de repartir et tu ne sauras jamais ce que c'était !", en: "Click quickly, or your parcel may be sent back and you'll never know what it was!",
        retour: { fr: "Justement : pousser à agir vite, c'est le piège classique des arnaques, pour qu'on clique sans réfléchir.", en: "That's the point: pushing you to act fast is the classic scam trick, so you click without thinking." } },
      { fr: "Réponds-leur pour leur demander ce que c'est.", en: 'Reply and ask them what it is.',
        retour: { fr: "Répondre montre que ton adresse est active : tu recevras encore plus d'arnaques.", en: 'Replying shows your address is active: you will get even more scams.' } }
    ],
    idees: [
      { nom: { fr: "c'est une arnaque", en: "it's a scam" },
        mots: ['arnaque', 'arnac', 'arnak', 'hameconnage', 'phishing', 'piege', 'fraude', 'escroc', 'faux mail', 'faux message', 'pirate', 'scam', 'fraud', 'trap', 'hacker'] },
      { nom: { fr: 'le message a des indices suspects (fautes, expéditeur)', en: 'the message has suspicious clues (mistakes, sender)' },
        mots: ['expediteur', 'envoye par', 'inconnu', 'adresse', 'qui l a envoye', 'faute', 'orthographe', 'preuve de depot', 'sender', 'unknown', 'address', 'spelling', 'mistake'] },
      { nom: { fr: "tu n'as rien commandé", en: "you didn't order anything" },
        mots: ['rien commande', 'pas commande', 'commande rien', 'aucune commande', 'didn t order', 'did not order', 'no order', 'nothing ordered'] },
      { nom: { fr: 'ne clique pas sur le lien', en: "don't click the link" },
        mots: ['clique pas', 'cliquer pas', 'pas cliquer', 'ne clique', 'ne pas cliquer', 'clic pas', 'click pas', 'touche pas', 'appuie pas', 'surtout pas', 'jamais cliquer', 'supprim', 'signal', 'dont click', 'don t click', 'do not click', 'never click', 'ignore', 'delete', 'report'] }
    ],
    indice: { fr: "Relis bien le texte de l'e-mail… et rappelle-toi ce que Sami a commandé.", en: 'Read the email text carefully… and remember what Sami ordered.' },
    modele: { fr: "C'est une arnaque : tu n'as rien commandé et le message est plein de fautes. Ne clique surtout pas.", en: "It's a scam: you didn't order anything and the message is full of mistakes. Don't click." },
    explication: { fr: "C'est une <b>arnaque par e-mail (hameçonnage)</b> qui imite un transporteur. Les indices : Sami <b>n'a rien commandé</b> ; le texte est plein de <b>fautes</b> (« une reprogrammation vous sont alors demandés ») ; et il se dit « preuve de dépôt », ce qui n'a aucun sens pour celui qui reçoit un colis. Le bouton mène à un faux site qui cherche à voler ses coordonnées ou la carte bancaire de ses parents. Pour être sûr, on regarde l'<b>adresse de l'expéditeur</b> : elle n'a souvent rien à voir avec le vrai transporteur.",
      en: "It's a <b>phishing email</b> pretending to be a delivery company. The clues: Sami <b>didn't order anything</b>; the text is full of <b>mistakes</b>; and it calls itself a “proof of posting”, which makes no sense for someone receiving a parcel. The button leads to a fake site trying to steal his details or his parents' card number. To be sure, check the <b>sender's address</b>: it often has nothing to do with the real company." },
    reflexe: { fr: "Colis inattendu + lien + fautes = arnaque. Ne clique pas : va toi-même sur le site ou l'appli officielle du transporteur.", en: "Unexpected parcel + link + mistakes = scam. Don't click: go to the delivery company's official site or app yourself." },
    merci: { fr: "Heureusement que je t'ai demandé 😬 je supprime.", en: 'Good thing I asked you 😬 deleting it.' }
  },

  {
    id: 'enfant-ia',
    ami: { nom: 'Emma', avatar: '🐱', couleur: '#c2571a' },
    heure: '18:56',
    messages: [
      { fr: 'Trop triste 😢', en: 'So sad 😢' },
      { image: 'images/enfant-ia.jpg', alt: { fr: "Publication Facebook de la page « Ta Petite Pause » : un jeune enfant dort par terre sous la pluie, avec le texte « Aujourd'hui c'est mon anniversaire, j'espère que j'aurai des cœurs », et 6 700 réactions.", en: 'Facebook post from the page “Ta Petite Pause”: a young child sleeping on the ground in the rain, with the text “Today is my birthday, I hope I get some hearts”, and 6,700 reactions.' } },
      { fr: "C'est l'anniversaire de ce petit et il dort sous la pluie 💔 J'ai liké et partagé pour l'aider, tout le monde devrait le faire !", en: "It's this little kid's birthday and they're sleeping in the rain 💔 I liked and shared it to help, everyone should!" }
    ],
    question: { fr: 'Emma est émue. Que lui réponds-tu ?', en: 'Emma is moved. What do you reply?' },
    qcm: [
      { bonne: true, fr: "Cette image est sûrement fabriquée par une IA pour récolter des likes : ton like n'aidera personne.", en: 'That image is probably AI-made to farm likes: your like will not help anyone.' },
      { fr: 'Oui, chaque like rapporte un euro à la famille, alors il faut en donner le plus possible.', en: 'Yes, every like earns the family one euro, so we should give as many as we can.',
        retour: { fr: "C'est une rumeur très répandue, mais un like ne rapporte rien à personne… sauf à la page qui le récolte.", en: 'That is a very common rumour, but a like earns nobody anything… except the page collecting it.' } },
      { fr: 'Je partage aussi, on ne sait jamais.', en: "I'll share it too, you never know.",
        retour: { fr: "Partager aide surtout la page à gagner de l'audience : c'est exactement ce qu'elle cherche.", en: 'Sharing mostly helps the page grow its audience: that is exactly what it wants.' } }
    ],
    idees: [
      { nom: { fr: "l'image est générée par une IA", en: 'the image is AI-generated' },
        mots: ['ia', 'i a', 'intelligence artificielle', 'artificiel', 'genere', 'generee', 'fabriqu', 'montage', 'faux enfant', 'existe pas', 'n existe pas', 'ai', 'generated', 'not real', 'doesn t exist'] },
      { nom: { fr: 'la page veut récolter des likes et des partages', en: 'the page wants to farm likes and shares' },
        mots: ['recolt', 'pour les likes', 'des likes', 'de likes', 'des coeurs', 'pour les partages', 'abonne', 'audience', 'engagement', 'vues', 'visibilite', 'argent', 'page', 'follower', 'farm', 'for likes', 'get likes', 'likes and shares', 'views', 'money', 'clickbait'] },
      { nom: { fr: "elle joue sur l'émotion", en: 'it plays on emotion' },
        mots: ['emotion', 'emouv', 'pitie', 'fait pleurer', 'joue sur', 'jouer sur', 'manipul', 'culpabil', 'feelings', 'emotional', 'pity', 'plays on', 'guilt'] }
    ],
    indice: { fr: "Qui publie cette image, et qu'est-ce que cette page gagne quand on like et partage ?", en: 'Who posts this image, and what does the page gain when people like and share?' },
    modele: { fr: "C'est une image faite par une IA pour récolter des likes : elle joue sur l'émotion, ton like n'aide personne.", en: "It's an AI image made to farm likes: it plays on emotion, your like helps nobody." },
    explication: { fr: "Cette image a été <b>générée par une IA</b> : l'enfant n'existe pas. Un indice : le texte est écrit comme si l'enfant parlait, alors que c'est une page, « Ta Petite Pause », qui publie. Un petit enfant n'écrit pas sur Facebook ! Ces pages publient des images tristes pour <b>récolter des milliers de likes et de partages</b>. Plus une page a d'abonnés, plus elle a de valeur : elle peut ensuite être revendue ou servir à des arnaques. <b>Émouvoir</b>, c'est le meilleur moyen de faire partager sans réfléchir.",
      en: 'This image was <b>generated by AI</b>: the child does not exist. A clue: the text is written as if the child were speaking, yet it is a page, “Ta Petite Pause”, posting it. A small child does not write on Facebook! Such pages post sad images to <b>farm thousands of likes and shares</b>. The more followers a page has, the more it is worth: it can then be sold or used for scams. <b>Stirring emotions</b> is the best way to get people to share without thinking.' },
    reflexe: { fr: "Quand une image te bouleverse, prends 10 secondes avant de liker ou partager : qui l'a publiée, et pourquoi ?", en: 'When an image upsets you, take 10 seconds before liking or sharing: who posted it, and why?' },
    merci: { fr: "Mais c'est horrible de faire ça… je retire mon partage.", en: "That's awful… I'm removing my share." }
  },

  {
    id: 'teddy',
    ami: { nom: 'Hugo', avatar: '🎸', couleur: '#794bc4' },
    heure: '12:47',
    messages: [
      { fr: 'Teddy Riner est avec Ford 🚗💪', en: 'Teddy Riner is with Ford 🚗💪' },
      { image: 'images/teddy-ford.jpg', alt: { fr: 'Publicité Ford : le judoka Teddy Riner en costume, avec le slogan « La performance, il faut tomber dedans quand on est petit ».', en: 'Ford advert: judoka Teddy Riner in a suit, with the slogan “Performance: you have to fall into it as a kid”.' } },
      { fr: "Si un champion comme lui a choisi Ford, c'est que c'est les meilleures voitures ! Mon père hésite pour sa nouvelle voiture, je vais lui dire", en: "If a champion like him chose Ford, they must be the best cars! My dad can't decide on a new car, I'll tell him" }
    ],
    question: { fr: 'Hugo est convaincu. Que lui réponds-tu ?', en: 'Hugo is convinced. What do you reply?' },
    qcm: [
      { bonne: true, fr: "C'est une pub : Ford paie Teddy Riner, et être champion de judo ne fait pas de lui un expert en voitures.", en: "It's an ad: Ford pays Teddy Riner, and being a judo champion doesn't make him a car expert." },
      { fr: "S'il le dit, c'est vrai : c'est un champion olympique, il ne ferait pas de pub pour n'importe quoi.", en: "If he says so, it's true: he's an Olympic champion, he wouldn't advertise just anything.",
        retour: { fr: "Il est champion de judo, pas spécialiste des voitures. Croire quelqu'un parce qu'il est célèbre, c'est l'argument d'autorité.", en: 'He is a judo champion, not a car specialist. Believing someone because they are famous is an appeal to authority.' } },
      { fr: 'Les champions ont toujours les meilleures voitures.', en: 'Champions always have the best cars.',
        retour: { fr: "Ça ne dit rien de la qualité des Ford… et rien ne dit qu'il en conduit une.", en: 'That says nothing about how good Fords are… and nothing says he even drives one.' } }
    ],
    idees: [
      { nom: { fr: "c'est une publicité payée", en: "it's a paid advert" },
        mots: ['pub', 'publicite', 'annonce', 'marketing', 'sponsor', 'partenariat', 'partenaire', 'ambassadeur', 'egerie', 'placement', 'paye', 'payer', 'paie', 'remuner', 'argent', 'contrat', 'influenc', 'ad', 'advert', 'paid', 'money', 'commercial', 'sponsored', 'ambassador'] },
      { nom: { fr: "ce n'est pas un expert des voitures", en: 'he is not a car expert' },
        mots: ['expert', 'specialiste', 'competent', 'connait rien', 'connait pas', 'y connait rien', 'autorite', 'pas son domaine', 'pas son metier', 'rien a voir', 'specialist', 'authority', 'his field', 'knows nothing', 'not a car', 'doesn t know'] }
    ],
    indice: { fr: 'Pourquoi Teddy Riner apparaît-il sur cette image ? Et quel est son vrai métier ?', en: 'Why does Teddy Riner appear in this picture? And what is his real job?' },
    modele: { fr: "C'est une pub : il est payé par Ford, et il est expert en judo, pas en voitures.", en: "It's an ad: Ford pays him, and he's a judo expert, not a car expert." },
    explication: { fr: "C'est une <b>publicité</b> : Ford paie Teddy Riner pour associer son image de champion à ses voitures. C'est un immense judoka, mais ça ne fait pas de lui un <b>expert en automobile</b>. D'ailleurs, il ne dit même pas que ce sont les meilleures voitures : le texte est écrit par Ford. Faire confiance à quelqu'un de célèbre sur un sujet qui n'est pas le sien, c'est l'<b>argument d'autorité</b>.",
      en: 'This is an <b>advert</b>: Ford pays Teddy Riner to link his champion image to its cars. He is a great judoka, but that does not make him a <b>car expert</b>. In fact, he never even says they are the best cars: the text is written by Ford. Trusting a famous person on a topic outside their field is an <b>appeal to authority</b>.' },
    reflexe: { fr: "Demande-toi toujours : cette personne est-elle payée pour dire ça, et s'y connaît-elle vraiment sur ce sujet ?", en: 'Always ask: is this person paid to say it, and do they really know the topic?' },
    merci: { fr: "Ah mais oui, c'est une pub… je vais plutôt regarder des comparatifs 🤔", en: "Oh right, it's an ad… I'll look at proper comparisons instead 🤔" }
  },

  {
    id: 'argent-facile',
    ami: { nom: 'Nathan', avatar: '🤑', couleur: '#6aa531' },
    heure: '21:09',
    messages: [
      { fr: 'Frère regarde 🤑', en: 'Bro look 🤑' },
      { image: 'images/pub-nft.jpg', alt: { fr: "Publicité vidéo signée « Whale » : « 10 000 € / mois — Ma stratégie NFT pour faire 10 000 € par mois ».", en: 'Video ad from “Whale”: “€10,000 / month — My NFT strategy to make €10,000 a month”.' } },
      { fr: "On peut gagner 10 000 € par mois avec les NFT et la vidéo explique comment ! Je vais mettre tout mon argent de poche dedans", en: "You can make €10,000 a month with NFTs and the video explains how! I'm putting all my pocket money in" }
    ],
    question: { fr: 'Nathan est prêt à tout miser. Que lui réponds-tu ?', en: 'Nathan is ready to bet everything. What do you reply?' },
    qcm: [
      { bonne: true, fr: "Méfie-toi : si c'était si facile, tout le monde serait riche. Et c'est une pub : qui gagne de l'argent, ici ?", en: "Careful: if it were that easy, everyone would be rich. And it's an ad: who is making money here?" },
      { fr: "Vas-y, c'est dans une vidéo de 15 minutes avec plein de graphiques, donc c'est sérieux.", en: "Go for it, it's a 15-minute video with lots of charts, so it's serious.",
        retour: { fr: "Une vidéo longue et des graphiques ne prouvent rien : n'importe qui peut dire n'importe quoi, surtout dans une publicité.", en: 'A long video and charts prove nothing: anyone can say anything, especially in an advert.' } },
      { fr: "Mets tout, comme ça tu gagneras plus.", en: "Put everything in, you'll make more.",
        retour: { fr: "Tu peux surtout tout perdre : ces placements sont très risqués.", en: 'Mostly, you could lose everything: these investments are very risky.' } }
    ],
    idees: [
      { nom: { fr: "c'est trop beau pour être vrai", en: "it's too good to be true" },
        mots: ['trop beau', 'trop facile', 'si facile', 'aussi facile', 'argent facile', 'promesse', 'miracle', 'rever', 'serait riche', 'seraient riches', 'tout le monde le ferait', 'too good', 'easy money', 'promise', 'too easy', 'everyone would'] },
      { nom: { fr: "c'est une pub : ce sont eux qui gagnent de l'argent", en: "it's an ad: they are the ones making money" },
        mots: ['pub', 'publicite', 'annonce', 'vend', 'formation', 'lui qui gagne', 'eux qui gagnent', 'qui gagne', 'ad', 'advert', 'selling', 'course', 'sells', 'who makes money'] },
      { nom: { fr: "c'est risqué, on peut tout perdre", en: "it's risky, you can lose everything" },
        mots: ['arnaque', 'arnak', 'risque', 'risqu', 'perdre', 'escroc', 'danger', 'scam', 'risk', 'lose', 'fraud'] }
    ],
    indice: { fr: "Si c'était vraiment si simple, pourquoi le dire à tout le monde ? Qui gagne de l'argent ici ?", en: 'If it were that simple, why tell everyone? Who is making money here?' },
    modele: { fr: "C'est trop beau pour être vrai : c'est une pub, eux gagnent de l'argent avec, et toi tu risques de tout perdre.", en: "It's too good to be true: it's an ad, they make money from it, and you could lose everything." },
    explication: { fr: "Cette publicité promet de l'<b>argent facile</b>. En réalité, ceux qui gagnent vraiment de l'argent, ce sont surtout ceux qui <b>vendent des « méthodes »</b> et des formations, ou qui paient ces pubs pour attirer des clients. Les NFT et les cryptomonnaies sont très risqués : on peut <b>tout perdre</b>. Une promesse trop belle doit toujours rendre méfiant.",
      en: 'This advert promises <b>easy money</b>. In reality, the people really making money are mostly those <b>selling “methods”</b> and courses, or paying for these ads to attract customers. NFTs and cryptocurrencies are very risky: you can <b>lose everything</b>. A promise that sounds too good should always make you wary.' },
    reflexe: { fr: "Si c'est trop beau pour être vrai, c'est sûrement faux. Demande-toi : qui gagne de l'argent si j'y crois ?", en: 'If it sounds too good to be true, it probably is. Ask: who makes money if I believe it?' },
    merci: { fr: 'Bon… je garde mon argent de poche 😅', en: "Ok… I'm keeping my pocket money 😅" }
  },

  {
    id: 'flamant',
    ami: { nom: 'Chloé', avatar: '🦩', couleur: '#0f8f9e' },
    heure: '15:12',
    messages: [
      { fr: "C'est de l'IA ça, c'est sûr 🤖", en: "That's AI for sure 🤖" },
      { image: 'images/flamant.jpg', alt: { fr: "Photo d'un flamant rose sur une plage, qui semble ne pas avoir de tête.", en: 'Photo of a flamingo on a beach that seems to have no head.' } },
      { fr: "Un flamant rose sans tête ?! Personne peut croire que c'est une vraie photo 😂", en: 'A headless flamingo?! Nobody could believe this is a real photo 😂' }
    ],
    question: { fr: 'Chloé est catégorique. Que lui réponds-tu ?', en: 'Chloé is adamant. What do you reply?' },
    qcm: [
      { bonne: true, fr: "Ne conclus pas trop vite : ça peut être une vraie photo. Il faut vérifier d'où elle vient.", en: "Don't jump to conclusions: it could be a real photo. Check where it comes from." },
      { fr: "Oui, et la plage est trop parfaite, avec une lumière trop belle : c'est forcément de l'IA.", en: 'Yes, and the beach is too perfect, the light too pretty: it must be AI.',
        retour: { fr: "Une belle lumière ne prouve rien : de vrais photographes font aussi des images très soignées.", en: 'Nice lighting proves nothing: real photographers make very polished images too.' } },
      { fr: "Oui, tout ce qui est bizarre est fait par une IA.", en: 'Yes, anything weird is made by AI.',
        retour: { fr: "Bizarre ne veut pas dire faux : la nature et les photographes réservent des surprises.", en: 'Weird does not mean fake: nature and photographers have surprises in store.' } }
    ],
    idees: [
      { nom: { fr: 'ça peut être une vraie photo', en: 'it could be a real photo' },
        mots: ['vraie', 'vrai photo', 'reel$', 'reelle', 'pas de l ia', 'pas ia', 'pas forcement', 'pas sur', 'photographe', 'deja vu', 'peut exister', 'real$', 'genuine', 'not ai', 'photographer', 'not necessarily'] },
      { nom: { fr: 'il faut vérifier son origine', en: 'check where it comes from' },
        mots: ['verifi', 'source', 'origine', 'qui l a prise', 'recherche', 'check', 'origin', 'search', 'who took'] },
      { nom: { fr: 'le flamant cache sa tête', en: 'the flamingo is hiding its head' },
        mots: ['cache', 'tete dans', 'tete sous', 'tete derriere', 'tete cachee', 'gratte', 'plume', 'aile$', 'dos$', 'ventre', 'dort', 'dormir', 'hiding', 'hidden', 'tucked', 'head in', 'head under', 'scratch', 'feather', 'wing', 'belly', 'sleep'] }
    ],
    contre: { mots: ['ia', 'i a', 'intelligence artificielle', 'genere', 'ai', 'generated'],
      retour: { fr: "Justement, rien ne prouve que c'est une IA. Et si c'était une vraie photo ?", en: 'Actually, nothing proves it is AI. What if it were a real photo?' } },
    indice: { fr: "Un flamant peut-il cacher sa tête ? Et comment savoir si une photo est vraie ou non ?", en: 'Can a flamingo hide its head? And how do you know whether a photo is real?' },
    modele: { fr: "Pas si vite : c'est peut-être une vraie photo, le flamant cache sa tête. Il faut vérifier d'où elle vient.", en: "Not so fast: it may be a real photo, the flamingo is hiding its head. Check where it comes from." },
    explication: { fr: "Surprise : c'est une <b>vraie photo</b> ! Le flamant se gratte, la tête cachée dans ses plumes. Cette photo de Miles Astray, prise à Aruba, a été inscrite en 2024 dans la catégorie « IA » d'un concours photo : le jury et le public l'ont récompensée… puis elle a été <b>disqualifiée parce qu'elle était réelle</b>. Tout ce qui paraît bizarre n'est pas forcément faux : on <b>vérifie dans les deux sens</b>.",
      en: 'Surprise: it is a <b>real photo</b>! The flamingo is scratching itself, head tucked into its feathers. This photo by Miles Astray, taken in Aruba, was entered in 2024 in the “AI” category of a photo contest: both the jury and the public gave it awards… then it was <b>disqualified because it was real</b>. Not everything strange is fake: <b>check both ways</b>.' },
    reflexe: { fr: "Ne crie pas « fake » trop vite non plus : vérifier, c'est chercher la vérité, pas douter de tout.", en: "Don't shout “fake” too fast either: checking means looking for the truth, not doubting everything." },
    merci: { fr: "J'ai cherché : c'est une vraie photo, il se gratte juste 🤯", en: "I checked: it's a real photo, it's just scratching 🤯" }
  }
];
