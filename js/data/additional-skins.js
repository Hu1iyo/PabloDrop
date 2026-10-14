const ADDITIONAL_SKINS = [
    { caseId: 10, name: 'AWP | Black Nile', price: 70, rarity: 'lightblue' },
    { caseId: 10, name: 'AWP | Mortis', price: 180, rarity: 'lightblue' },
    { caseId: 10, name: 'AWP | BOOM', price: 650, rarity: 'purple' },
    { caseId: 10, name: 'AWP | Elite Build', price: 120, rarity: 'lightblue' },
    { caseId: 10, name: 'AWP | Oni Taiji', price: 4200, rarity: 'red' },
    { caseId: 10, name: 'AWP | The Prince', price: 42000, rarity: 'gold' },
    { caseId: 10, name: 'AWP | PAW', price: 120, rarity: 'lightblue' },
    { caseId: 10, name: 'AWP | Pink DDPAT', price: 160, rarity: 'lightblue' },
    { caseId: 10, name: 'AWP | Sun in Leo', price: 250, rarity: 'blue' },
    { caseId: 10, name: 'AWP | Acheron', price: 65, rarity: 'white' },

    { caseId: 11, name: 'AK-47 | Head Shot', price: 850, rarity: 'purple' },
    { caseId: 11, name: 'AK-47 | Legion of Anubis', price: 720, rarity: 'purple' },
    { caseId: 11, name: 'AK-47 | Orbit Mk01', price: 240, rarity: 'blue' },
    { caseId: 11, name: 'AK-47 | Aquamarine Revenge', price: 1500, rarity: 'pink' },
    { caseId: 11, name: 'AK-47 | Jaguar', price: 2300, rarity: 'red' },
    { caseId: 11, name: 'AK-47 | The Oligarch', price: 1300, rarity: 'pink' },
    { caseId: 11, name: 'AK-47 | Nouveau Rouge', price: 800, rarity: 'purple' },
    { caseId: 11, name: 'AK-47 | Inheritance', price: 1600, rarity: 'pink' },
    { caseId: 11, name: 'AK-47 | Wasteland Rebel', price: 2800, rarity: 'red' },
    { caseId: 11, name: 'AK-47 | Hydroponic', price: 18000, rarity: 'gold' },

    { caseId: 12, name: 'M4A4 | Temukau', price: 1800, rarity: 'pink' },
    { caseId: 12, name: 'M4A4 | The Battlestar', price: 320, rarity: 'blue' },
    { caseId: 12, name: 'M4A4 | Hellfire', price: 1800, rarity: 'pink' },
    { caseId: 12, name: 'M4A4 | Converter', price: 120, rarity: 'lightblue' },
    { caseId: 12, name: 'M4A4 | Buzz Kill', price: 1400, rarity: 'pink' },
    { caseId: 12, name: 'M4A4 | The Coalition', price: 3000, rarity: 'red' },
    { caseId: 12, name: 'M4A4 | Spider Lily', price: 480, rarity: 'blue' },
    { caseId: 12, name: 'M4A4 | Royal Paladin', price: 900, rarity: 'purple' },
    { caseId: 12, name: 'M4A4 | Griffin', price: 260, rarity: 'blue' },
    { caseId: 12, name: 'M4A4 | Magnesium', price: 75, rarity: 'lightblue' },

    { caseId: 13, name: 'Bayonet | Doppler', price: 18000, rarity: 'gold' },
    { caseId: 13, name: 'Bayonet | Marble Fade', price: 14000, rarity: 'gold' },
    { caseId: 13, name: 'Bayonet | Tiger Tooth', price: 12000, rarity: 'gold' },
    { caseId: 13, name: 'Bayonet | Lore', price: 11000, rarity: 'gold' },
    { caseId: 13, name: 'Bayonet | Autotronic', price: 8000, rarity: 'gold' },
    { caseId: 13, name: 'Bayonet | Gamma Doppler', price: 22000, rarity: 'gold' },
    { caseId: 13, name: 'Classic Knife | Fade', price: 9000, rarity: 'gold' },
    { caseId: 13, name: 'Classic Knife | Slaughter', price: 6000, rarity: 'gold' },
    { caseId: 13, name: 'Nomad Knife | Crimson Web', price: 7500, rarity: 'gold' },
    { caseId: 13, name: 'Skeleton Knife | Blue Steel', price: 8500, rarity: 'gold' },

    { caseId: 17, name: 'P250 | Asiimov', price: 160, rarity: 'lightblue' },
    { caseId: 17, name: 'M4A1-S | Golden Coil', price: 1100, rarity: 'purple' },
    { caseId: 17, name: 'FAMAS | Djinn', price: 150, rarity: 'lightblue' },
    { caseId: 17, name: 'P90 | Shallow Grave', price: 340, rarity: 'blue' },
    { caseId: 17, name: 'USP-S | Jawbreaker', price: 420, rarity: 'blue' },
    { caseId: 17, name: 'MP9 | Dart', price: 30, rarity: 'white' },
    { caseId: 17, name: 'FAMAS | Eye of Athena', price: 350, rarity: 'blue' },
    { caseId: 17, name: 'Galil AR | Sugar Rush', price: 900, rarity: 'purple' },
    { caseId: 17, name: 'AK-47 | The Empress', price: 2600, rarity: 'red' },
    { caseId: 17, name: 'M4A1-S | Chantico\'s Fire', price: 2100, rarity: 'red' },

    { caseId: 19, name: 'Glock-18 | High Beam', price: 20, rarity: 'white' },
    { caseId: 19, name: 'Glock-18 | Oxide Blaze', price: 35, rarity: 'white' },
    { caseId: 19, name: 'USP-S | Target Acquired', price: 1700, rarity: 'pink' },
    { caseId: 19, name: 'USP-S | Monster Mashup', price: 900, rarity: 'purple' },
    { caseId: 19, name: 'Desert Eagle | Trigger Discipline', price: 65, rarity: 'white' },
    { caseId: 19, name: 'Desert Eagle | Mecha Industries', price: 480, rarity: 'blue' },
    { caseId: 19, name: 'P250 | Undertow', price: 210, rarity: 'lightblue' },
    { caseId: 19, name: 'Tec-9 | Decimator', price: 220, rarity: 'lightblue' },
    { caseId: 19, name: 'CZ75-Auto | The Fuschia Is Now', price: 550, rarity: 'blue' },
    { caseId: 19, name: 'R8 Revolver | Survivalist', price: 45, rarity: 'white' },

    { caseId: 20, name: 'MAC-10 | Gold Brick', price: 230, rarity: 'blue' },
    { caseId: 20, name: 'MAC-10 | Stalker', price: 750, rarity: 'purple' },
    { caseId: 20, name: 'MP7 | Guerrilla', price: 180, rarity: 'lightblue' },
    { caseId: 20, name: 'MP7 | Vault Heist', price: 120, rarity: 'lightblue' },
    { caseId: 20, name: 'MP9 | Airlock', price: 160, rarity: 'lightblue' },
    { caseId: 20, name: 'UMP-45 | Plastique', price: 250, rarity: 'blue' },
    { caseId: 20, name: 'UMP-45 | Delusion', price: 90, rarity: 'lightblue' },
    { caseId: 20, name: 'PP-Bizon | Judgement of Anubis', price: 580, rarity: 'blue' },
    { caseId: 20, name: 'PP-Bizon | High Roller', price: 380, rarity: 'blue' },
    { caseId: 20, name: 'MP5-SD | Phosphor', price: 260, rarity: 'blue' },

    { caseId: 21, name: 'XM1014 | Seasons', price: 180, rarity: 'lightblue' },
    { caseId: 21, name: 'XM1014 | Elegant Vines', price: 90, rarity: 'lightblue' },
    { caseId: 21, name: 'MAG-7 | Hard Water', price: 50, rarity: 'white' },
    { caseId: 21, name: 'MAG-7 | Petroglyph', price: 95, rarity: 'lightblue' },
    { caseId: 21, name: 'Sawed-Off | Mosaico', price: 75, rarity: 'lightblue' },
    { caseId: 21, name: 'Sawed-Off | Amber Fade', price: 190, rarity: 'blue' },
    { caseId: 21, name: 'Negev | Bratatat', price: 55, rarity: 'white' },
    { caseId: 21, name: 'Negev | Loudmouth', price: 160, rarity: 'lightblue' },
    { caseId: 21, name: 'M249 | Shipping Forecast', price: 150, rarity: 'lightblue' },
    { caseId: 21, name: 'M249 | Nebula Crusader', price: 220, rarity: 'blue' },
];

const existingSkinNames = new Set(CASES.flatMap(caseItem =>
    caseItem.items.map(item => item.name.toLocaleLowerCase())
));

ADDITIONAL_SKINS.forEach(({ caseId, ...skin }) => {
    const targetCase = CASES.find(caseItem => caseItem.id === caseId);
    if (!targetCase) throw new Error(`Case ${caseId} for additional skin "${skin.name}" was not found`);

    const normalizedName = skin.name.toLocaleLowerCase();
    if (existingSkinNames.has(normalizedName)) {
        throw new Error(`Additional skin "${skin.name}" already exists in the case catalog`);
    }

    targetCase.items.push(skin);
    existingSkinNames.add(normalizedName);
});
