// Word dictionary for Impiccato mode
// Organized by word length (5-8 letters)

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
        "FIUME", "PIGNA", "BELLO", "CIGNO", "BORSA", "ARENA", "BRUCO", "FALCO",
        "FORSE", "CASCO", "CALDO", "CARNE", "BECCO", "STILE", "RULLO", "SPINA",
        "RAGNO", "BRUNO", "CONTO", "CREDO", "CREMA", "PARLO", "PENTO", "VOLTA"
    ],
    6: [
        "ANDARE", "POTERE", "DOVERE", "VOLERE", "SAPERE", "VENIRE", "TENERE", "SEDERE",
        "CADERE", "VEDERE", "SALIRE", "USCIRE", "APRIRE", "FINIRE", "MORIRE", "RIDERE",
        "CEDERE", "VIVERE", "TACERE", "VALERE", "DOLERE", "TEMERE", "GODERE", "CUCIRE",
        "FERIRE", "PULIRE", "CAPIRE", "RIDARE", "SEDARE", "BADARE", "LODARE", "BASARE",
        "GRANDE", "BRUTTO", "BIANCO", "GIALLO", "CHIARO", "DEBOLE", "LIBERO", "POVERO",
        "FREDDO", "SALATO", "SICURO", "SERENO", "TRISTE", "FELICE", "MOBILE", "GIUSTO",
        "INTERO", "DOPPIO", "TRIPLO", "ULTIMO", "QUARTO", "QUINTO", "OTTAVO", "STRANO",
        "GRASSO", "OSCURO", "FUTURO", "MATURO", "ACERBO", "IGNOTO", "NOBILE", "DOCILE",
        "FACILE", "SIMILE", "UGUALE", "FACETO", "SOBRIO", "ATTIVO", "PIATTO", "QUIETO",
        "ONESTO", "ADATTO", "ESATTO", "RAPIDO", "TIMIDO", "RIGIDO", "SOLIDO", "VALIDO"
    ],
    7: [
        "PARLARE", "SENTIRE", "PARTIRE", "CREDERE", "LEGGERE", "METTERE", "PERDERE", "RENDERE",
        "VENDERE", "RIDURRE", "COPRIRE", "OFFRIRE", "DORMIRE", "VESTIRE", "SERVIRE", "SEGUIRE",
        "PICCOLO", "GIOVANE", "VECCHIO", "DIVERSO", "NORMALE", "SOCIALE", "TORNARE", "PORTARE",
        "RESTARE", "PASSARE", "MANDARE", "TROVARE", "PREGARE", "OPERARE", "NARRARE", "SERRARE",
        "FERRARE", "TERRARE", "VERSARE", "PENSARE", "CAUSARE", "SCUSARE", "AIUTARE", "CANTARE",
        "CONTARE", "MONTARE", "SALTARE", "VOLTARE", "BASTARE", "GUSTARE", "TESTARE", "PESTARE",
        "COSTARE", "POSTARE", "FORMARE", "FERMARE", "CALMARE", "PALMARE", "FIRMARE", "COLMARE",
        "ANIMARE", "STIMARE", "SFUMARE", "SPUMARE", "SPIRARE", "SPARARE", "COMPARE", "GIURARE"
    ],
    8: [
        "SCENDERE", "CHIEDERE", "SPENDERE", "DECIDERE", "DIVIDERE", "TRADURRE", "PRODURRE", "CONDURRE",
        "SCOPRIRE", "SOFFRIRE", "RIUSCIRE", "PROPORRE", "DISPORRE", "COMPORRE", "SUPPORRE", "PRENDERE",
        "PERFETTO", "SPECIALE", "CENTRALE", "GENERALE", "NATURALE", "MONDIALE", "REGOLARE", "POPOLARE",
        "COMPLETO", "VISIBILE", "NOTEVOLE", "AFFABILE", "DURABILE", "APPARIRE", "RIAPRIRE", "DIMORARE",
        "COLORARE", "DECORARE", "IGNORARE", "SCOLPIRE", "ASSALIRE", "RISALIRE", "DEFINIRE", "RIFINIRE",
        "AFFINARE", "DOMINARE", "NOMINARE", "RUMINARE", "SEMINARE", "LAMINARE", "INGERIRE", "MOSTRARE"
    ]
};

// Helper function to get random word of specific length
function getRandomWord(length) {
    const list = WORDS[length];
    if (!list || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
}

module.exports = { WORDS, getRandomWord };
