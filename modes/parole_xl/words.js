// Container for words of different lengths.
// Manually insert words into the respective arrays.
// Format: Strings in uppercase.

const WORDS = {
    5: [
        "AMORE", "MONDO", "CUORE", "DONNA", "TEMPO", "LUOGO", "FELPA", "FORTE",
        "VENTO", "ACQUA", "LATTE", "PIANO", "PESCE", "AMICO", "FIORI", "PALLA",
        "NOTTE", "SEDIA", "TRENO", "BOSCO", "LETTO", "CUOCO", "PIZZA", "CIELO",
        "FANGO", "NUOVO", "BAGNO", "SOGNO", "PIENO", "VERDE", "LENTO", "PESCA",
        "VESPA", "TORRE", "MENTE", "VIGNA", "PORTA", "VISTO", "NERVO", "PESTO",
        "SFERA", "BANCA", "LASSO", "FETTA", "CANTO", "MORDE", "GIOCO", "RESTO",
        "NOTTI", "OLIVA", "CUORI", "TETTO", "AEREO", "SCALO", "PESCI", "LASER",
        "SENSO", "VINTO", "DOLCE", "FERRO", "TASTO", "MENSA", "PUNTO", "SCALA",
        "MARMO", "BOCCA", "BRANO", "DENTE", "LETTA", "BRAVO", "AMICA", "CARTA",
        "PARCO", "BANCO", "PANCA", "PERLA", "MONTE", "MAREA", "GATTO", "TENDA",
        "FIUME", "BRANO", "PIGNA", "BELLO", "CIGNO", "BORSA", "ARENA", "BRUCO",
        "FORSE", "CASCO", "CALDO", "CARNE", "BECCO", "STILE", "RULLO", "SPINA",
        "RAGNO", "BRUNO", "CONTO", "CREDO", "CREMA", "PARLO", "PENTO", "VOLTA",
        "ABBIA", "ACETO", "ADIRA", "AFOSA", "AGILE", "ALICE", "AMICO", "ANIMA",
        "AORTA", "ARIDO", "ASILO", "AVARO", "BACIO", "BALZO", "BANCA", "BARCO",
        "BELLO", "BEVVI", "BISSA", "BOLLA", "BORSA", "BOTTO", "BRUNO", "BURRO",
        "CALDO", "CAMPO", "CANNA", "CANTO", "CARNE", "CARTA", "CASSE", "CASTO",
        "CAVIA", "CELLA", "CERTO", "CHINA", "CIELO", "CINTO", "CIVET", "CLIMA",
        "COCCO", "COLLE", "CORPO", "COSTA", "COTTO", "CREMA", "CRISI", "CUORE",
        "DANZA", "DENTE", "DOLCE", "DONNA", "DOTTO", "DURTO", "EDEMA", "EMANA",
        "ENTRA", "ESITO", "EVITA", "FANGO", "FARSA", "FERRO", "FISSA", "FIUME",
        "FOLLA", "FORTE", "FRENO", "FUGGI", "FURBO", "GALLA", "GATTO",
        "GIARA", "GIOIA", "GOBBO", "GRANO", "GRECO", "GUIDA", "HOBBY", "HOTEL",
        "CANTO", "INDIO", "IRIDE", "ISOLA", "LARGO", "LATTA", "LEGNO",
        "LETTO", "LIEVE", "LIRIO", "LODAI", "LORDA", "LOTTO", "LUNGO", "LUOGO",
        "MADRE", "MAREE", "MORTE", "BALLA", "AGGIO", "AGLIO", "ACUTI", "AMARO",
        "ASCIA", "BAULE", "CALZE", "COTTO", "CALDO", "BENDE", "ADDIO", "ACETO",
        "COLPA", "CIECO", "CREMA", "CREME", "DORMO", "DENSO", "CORSE", "CLONI",
        "FORTE", "FRIGO", "FORZE", "FIORE", "ALGHE", "AGILE", "FALCO", "DIETA"
    ],
    6: [
        "ANDARE", "POTERE", "DOVERE", "VOLERE", "SAPERE", "VENIRE", "TENERE", "SEDERE",
        "CADERE", "VEDERE", "SALIRE", "USCIRE", "APRIRE", "FINIRE", "MORIRE", "RIDERE",
        "CEDERE", "VIVERE", "TACERE", "VALERE", "DOLERE", "TEMERE", "GODERE", "CUCIRE",
        "FERIRE", "PULIRE", "CAPIRE", "RIDARE", "SEDARE", "BADARE", "LODARE", "BASARE",
        "POSARE", "DOSARE", "VOTARE", "NOTARE", "DOTARE", "ROTARE", "MUTARE", "CITARE",
        "GITARE", "ALZARE", "ORNARE", "DONARE", "ZONARE", "SONARE", "CURARE", "DURARE",
        "MURARE", "TIRARE", "MIRARE", "VIRARE", "GIRARE", "FIRARE", "PESARE", "CESARE",
        "LESARE", "RASARE", "GRANDE", "BRUTTO", "BIANCO", "GIALLO", "CHIARO", "DEBOLE",
        "LIBERO", "POVERO", "FREDDO", "SALATO", "SICURO", "SERENO", "TRISTE", "FELICE",
        "MOBILE", "GIUSTO", "INTERO", "DOPPIO", "TRIPLO", "ULTIMO", "QUARTO", "QUINTO",
        "OTTAVO", "STRANO", "GRASSO", "OSCURO", "FUTURO", "MATURO", "ACERBO", "IGNOTO",
        "NOBILE", "DOCILE", "FACILE", "SIMILE", "UGUALE", "FACETO", "SOBRIO", "ATTIVO",
        "PIATTO", "QUIETO", "ONESTO", "ADATTO", "ESATTO", "RAPIDO", "TIMIDO", "RIGIDO",
        "SOLIDO", "VALIDO", "GELIDO", "FLUIDO", "NITIDO", "VIVIDO", "ASTUTO", "MINUTO",
        "TENUTO", "VENUTO", "SAPUTO", "VOLUTO", "POTUTO", "DOVUTO", "CADUTO", "VEDUTO",
        "FINITO", "SALITO", "USCITO", "APERTO", "ACCESO", "CHIUSO", "GIUNTO", "SPINTO",
        "MALATO", "PRONTO", "SVELTO", "CIVILE", "VIRILE", "SENILE", "OSTILE", "DIVINO",
        "SERENO", "SAGGIO", "STOLTO", "MISERO", "SCARSO", "SOBRIO", "PINGUE", "CRASSO",
        "SNELLO", "ARDITO", "TIMIDO", "AUDACE"
    ],
    7: [
        "PARLARE", "SENTIRE", "PARTIRE", "CREDERE", "LEGGERE", "METTERE", "PERDERE", "RENDERE",
        "VENDERE", "RIDURRE", "COPRIRE", "OFFRIRE", "DORMIRE", "VESTIRE", "SERVIRE", "SEGUIRE",
        "PICCOLO", "GIOVANE", "VECCHIO", "DIVERSO", "NORMALE", "SOCIALE", "TORNARE", "PORTARE",
        "RESTARE", "PASSARE", "MANDARE", "TROVARE", "PREGARE", "OPERARE", "NARRARE", "SERRARE",
        "FERRARE", "TERRARE", "VERSARE", "PENSARE", "CAUSARE", "SCUSARE", "AIUTARE", "CANTARE",
        "CONTARE", "MONTARE", "SALTARE", "VOLTARE", "BASTARE", "GUSTARE", "TESTARE", "PESTARE",
        "COSTARE", "POSTARE", "FORMARE", "FERMARE", "CALMARE", "PALMARE", "FIRMARE", "COLMARE",
        "ANIMARE", "STIMARE", "SFUMARE", "SPUMARE", "SPIRARE", "SPARARE", "COMPARE", "GIURARE",
        "IMPORRE", "OPPORRE", "ESPORRE", "MORDERE", "TENDERE", "FENDERE", "ERODERE", "PRUDERE",
        "ELUDERE", "FALLIRE", "BOLLIRE", "ABOLIRE", "CONFINE", "FORNIRE", "MENTIRE", "SMENTIRE",
        "PENTIRE", "SORTIRE", "GESTIRE", "ARGUIRE", "INTUIRE", "RUGGIRE", "RIDURRE", "MORDERE",
        "SMORIRE", "FIORIRE", "NUTRARE", "NUTRIRE"
    ],
    8: [
        "SCENDERE", "CHIEDERE", "SPENDERE", "DECIDERE", "DIVIDERE", "TRADURRE", "PRODURRE", "CONDURRE",
        "SCOPRIRE", "SOFFRIRE", "RIUSCIRE", "PROPORRE", "DISPORRE", "COMPORRE", "SUPPORRE", "PRENDERE",
        "PERFETTO", "SPECIALE", "CENTRALE", "GENERALE", "NATURALE", "MONDIALE", "REGOLARE", "POPOLARE",
        "COMPLETO", "VISIBILE", "NOTEVOLE", "AFFABILE", "DURABILE", "APPARIRE", "RIAPRIRE", "DIMORARE",
        "COLORARE", "DECORARE", "IGNORARE", "SCOLPIRE", "ASSALIRE", "RISALIRE", "DEFINIRE", "RIFINIRE",
        "AFFINARE", "DOMINARE", "NOMINARE", "RUMINARE", "SEMINARE", "LAMINARE", "INGERIRE", "MOSTRARE",
        "LUSTRARE", "CASTRARE", "ASTRARRE", "RITRARRE", "ESTRARRE", "SMENTIRE", "SPARTIRE", "RIFERIRE",
        "GIUNGERE", "SPORGERE", "SCORGERE", "FRANGERE", "SPINGERE"
    ]
};

// Helper function to get random word of specific length
function getRandomWord(length) {
    const list = WORDS[length];
    if (!list || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
}

// Check if word is valid (now allows ANY word)
function isValidWord(word) {
    return true;
}

module.exports = { WORDS, getRandomWord, isValidWord };
