// ===== ПУЛ СКИНОВ =====
const SKINS_POOL = [
    // Ширпотреб (white) — 3-50₽
    { name: 'P250 | Sand Dune', price: 3, rarity: 'white' },
    { name: 'MP9 | Storm', price: 5, rarity: 'white' },
    { name: 'Nova | Predator', price: 8, rarity: 'white' },
    { name: 'MAG-7 | Sand Dune', price: 10, rarity: 'white' },
    { name: 'Sawed-Off | Snake Camo', price: 12, rarity: 'white' },
    { name: 'MAC-10 | Silver', price: 15, rarity: 'white' },
    { name: 'UMP-45 | Exposure', price: 18, rarity: 'white' },
    { name: 'P90 | Sand Spray', price: 20, rarity: 'white' },
    { name: 'MP7 | Army Recon', price: 15, rarity: 'white' },
    { name: 'Five-SeveN | Monkey Business', price: 25, rarity: 'white' },
    { name: 'Tec-9 | Ice Cap', price: 35, rarity: 'white' },
    { name: 'Glock-18 | Sand Dune', price: 8, rarity: 'white' },
    { name: 'USP-S | Forest Leaves', price: 12, rarity: 'white' },
    { name: 'Desert Eagle | Mudder', price: 20, rarity: 'white' },
    { name: 'AK-47 | Safari Mesh', price: 30, rarity: 'white' },
    { name: 'M4A4 | Desert-Strike', price: 45, rarity: 'white' },
    { name: 'AWP | Safari Mesh', price: 40, rarity: 'white' },
    { name: 'SSG 08 | Sand Dune', price: 25, rarity: 'white' },
    { name: 'SCAR-20 | Sand Mesh', price: 15, rarity: 'white' },
    { name: 'FAMAS | Colony', price: 10, rarity: 'white' },

    // Промышленное (lightblue) — 50-200₽
    { name: 'P250 | Mehndi', price: 60, rarity: 'lightblue' },
    { name: 'Nova | Polar Mesh', price: 80, rarity: 'lightblue' },
    { name: 'MAC-10 | Palm', price: 70, rarity: 'lightblue' },
    { name: 'MP9 | Hot Rod', price: 90, rarity: 'lightblue' },
    { name: 'UMP-45 | Carbon Fiber', price: 100, rarity: 'lightblue' },
    { name: 'P90 | Asiimov', price: 120, rarity: 'lightblue' },
    { name: 'MP7 | Fade', price: 150, rarity: 'lightblue' },
    { name: 'Five-SeveN | Copper Galaxy', price: 180, rarity: 'lightblue' },
    { name: 'Glock-18 | Bunsen Burner', price: 130, rarity: 'lightblue' },
    { name: 'Desert Eagle | Sunset Storm', price: 160, rarity: 'lightblue' },
    { name: 'AK-47 | Safari Mesh', price: 140, rarity: 'lightblue' },
    { name: 'M4A1-S | Master Piece', price: 170, rarity: 'lightblue' },
    { name: 'AWP | Chrome Cannon', price: 190, rarity: 'lightblue' },
    { name: 'SSG 08 | Sea Calico', price: 110, rarity: 'lightblue' },
    { name: 'FAMAS | Sandstorm', price: 95, rarity: 'lightblue' },
    { name: 'XM1014 | Tranquility', price: 85, rarity: 'lightblue' },
    { name: 'Negev | Power Loader', price: 105, rarity: 'lightblue' },
    { name: 'M249 | Magma', price: 125, rarity: 'lightblue' },
    { name: 'MAG-7 | Heat', price: 75, rarity: 'lightblue' },
    { name: 'Tec-9 | Sandstorm', price: 145, rarity: 'lightblue' },

    // Армейское (blue) — 200-500₽
    { name: 'AK-47 | Slate', price: 220, rarity: 'blue' },
    { name: 'M4A4 | Faded Zebra', price: 250, rarity: 'blue' },
    { name: 'AWP | Redline', price: 280, rarity: 'blue' },
    { name: 'Desert Eagle | Kode 9', price: 300, rarity: 'blue' },
    { name: 'Glock-18 | Water Elemental', price: 320, rarity: 'blue' },
    { name: 'USP-S | Purple DDPAT', price: 350, rarity: 'blue' },
    { name: 'P250 | Sand Dune', price: 240, rarity: 'blue' },
    { name: 'Nova | Wood Fish', price: 260, rarity: 'blue' },
    { name: 'MP9 | Hydra', price: 280, rarity: 'blue' },
    { name: 'UMP-45 | Primal Saber', price: 310, rarity: 'blue' },
    { name: 'P90 | Death Grip', price: 340, rarity: 'blue' },
    { name: 'MAC-10 | Neon Rider', price: 370, rarity: 'blue' },
    { name: 'Five-SeveN | Hyper Beast', price: 400, rarity: 'blue' },
    { name: 'M4A1-S | Dark Water', price: 420, rarity: 'blue' },
    { name: 'AK-47 | Elite 1.6', price: 450, rarity: 'blue' },
    { name: 'AWP | Lightning Strike', price: 480, rarity: 'blue' },
    { name: 'SSG 08 | Abyss', price: 380, rarity: 'blue' },
    { name: 'SCAR-20 | Carbon Fiber', price: 360, rarity: 'blue' },
    { name: 'FAMAS | Mecha Industries', price: 410, rarity: 'blue' },
    { name: 'XM1014 | Incinegrator', price: 440, rarity: 'blue' },

    // Запрещённое (purple) — 500-1500₽
    { name: 'AK-47 | Redline', price: 550, rarity: 'purple' },
    { name: 'M4A1-S | Hyper Beast', price: 600, rarity: 'purple' },
    { name: 'AWP | Asiimov', price: 650, rarity: 'purple' },
    { name: 'Desert Eagle | Blaze', price: 700, rarity: 'purple' },
    { name: 'USP-S | Cortex', price: 750, rarity: 'purple' },
    { name: 'Glock-18 | Fade', price: 800, rarity: 'purple' },
    { name: 'AK-47 | Vulcan', price: 850, rarity: 'purple' },
    { name: 'M4A4 | Desolate Space', price: 900, rarity: 'purple' },
    { name: 'AWP | Hyper Beast', price: 950, rarity: 'purple' },
    { name: 'P250 | Dragon Scale', price: 1000, rarity: 'purple' },
    { name: 'Nova | Hyper Beast', price: 1050, rarity: 'purple' },
    { name: 'MP7 | Nemesis', price: 1100, rarity: 'purple' },
    { name: 'P90 | Death by Kitty', price: 1150, rarity: 'purple' },
    { name: 'UMP-45 | Gold Bismuth', price: 1200, rarity: 'purple' },
    { name: 'MAC-10 | Silver', price: 1250, rarity: 'purple' },
    { name: 'Five-SeveN | Monkey Business', price: 1300, rarity: 'purple' },
    { name: 'Tec-9 | Ice Cap', price: 1350, rarity: 'purple' },
    { name: 'M4A1-S | Moss Quartz', price: 1400, rarity: 'purple' },
    { name: 'AK-47 | Bloodsport', price: 1450, rarity: 'purple' },
    { name: 'AWP | Neo-Noir', price: 1500, rarity: 'purple' },

    // Засекреченное (pink) — 1500-5000₽
    { name: 'AK-47 | Neon Rider', price: 1600, rarity: 'pink' },
    { name: 'M4A4 | In Living Color', price: 1700, rarity: 'pink' },
    { name: 'AWP | Dragon Fire', price: 1800, rarity: 'pink' },
    { name: 'Desert Eagle | Kumicho Dragon', price: 1900, rarity: 'pink' },
    { name: 'USP-S | Kill Confirmed', price: 2000, rarity: 'pink' },
    { name: 'Glock-18 | Weasel', price: 2100, rarity: 'pink' },
    { name: 'AK-47 | Fire Serpent', price: 2200, rarity: 'pink' },
    { name: 'M4A4 | The Emperor', price: 2300, rarity: 'pink' },
    { name: 'AWP | Containment Breach', price: 2400, rarity: 'pink' },
    { name: 'P250 | Mehndi', price: 2500, rarity: 'pink' },
    { name: 'Nova | Predator', price: 2600, rarity: 'pink' },
    { name: 'MP9 | Storm', price: 2700, rarity: 'pink' },
    { name: 'UMP-45 | Exposure', price: 2800, rarity: 'pink' },
    { name: 'P90 | Sand Spray', price: 2900, rarity: 'pink' },
    { name: 'MAC-10 | Palm', price: 3000, rarity: 'pink' },
    { name: 'Five-SeveN | Copper Galaxy', price: 3200, rarity: 'pink' },
    { name: 'M4A1-S | Printstream', price: 3500, rarity: 'pink' },
    { name: 'AK-47 | Gold Arabesque', price: 4000, rarity: 'pink' },
    { name: 'AWP | Medusa', price: 4500, rarity: 'pink' },
    { name: 'M4A4 | Poseidon', price: 5000, rarity: 'pink' },

    // Тайное (red) — 5000-25000₽
    { name: 'AK-47 | Wild Lotus', price: 6000, rarity: 'red' },
    { name: 'M4A4 | Howl', price: 7000, rarity: 'red' },
    { name: 'AWP | Dragon Lore', price: 8000, rarity: 'red' },
    { name: 'Karambit | Fade', price: 9000, rarity: 'red' },
    { name: 'M9 Bayonet | Tiger Tooth', price: 10000, rarity: 'red' },
    { name: 'Butterfly Knife | Doppler', price: 12000, rarity: 'red' },
    { name: 'AK-47 | Gold Arabesque', price: 14000, rarity: 'red' },
    { name: 'M4A1-S | Hot Rod', price: 16000, rarity: 'red' },
    { name: 'AWP | Gungnir', price: 18000, rarity: 'red' },
    { name: 'Karambit | Gamma Doppler', price: 20000, rarity: 'red' },
    { name: 'M9 Bayonet | Crimson Web', price: 22000, rarity: 'red' },
    { name: 'Butterfly Knife | Marble Fade', price: 25000, rarity: 'red' },
    { name: 'AK-47 | Fire Serpent', price: 15000, rarity: 'red' },
    { name: 'M4A4 | Poseidon', price: 17000, rarity: 'red' },
    { name: 'AWP | Medusa', price: 19000, rarity: 'red' },
    { name: 'Desert Eagle | Golden Koi', price: 21000, rarity: 'red' },
    { name: 'Glock-18 | Fade', price: 23000, rarity: 'red' },
    { name: 'USP-S | Printstream', price: 24000, rarity: 'red' },
    { name: 'Karambit | Tiger Tooth', price: 20000, rarity: 'red' },
    { name: 'M9 Bayonet | Rust Coat', price: 18000, rarity: 'red' },

    // Экстраординарное (gold) — 25000-250000₽
    { name: 'Karambit | Sapphire', price: 30000, rarity: 'gold' },
    { name: 'M9 Bayonet | Ruby', price: 35000, rarity: 'gold' },
    { name: 'Butterfly Knife | Sapphire', price: 40000, rarity: 'gold' },
    { name: 'Karambit | Ruby', price: 45000, rarity: 'gold' },
    { name: 'M9 Bayonet | Sapphire', price: 50000, rarity: 'gold' },
    { name: 'AK-47 | Wild Lotus', price: 60000, rarity: 'gold' },
    { name: 'M4A4 | Howl', price: 70000, rarity: 'gold' },
    { name: 'AWP | Dragon Lore', price: 80000, rarity: 'gold' },
    { name: 'Karambit | Gamma Doppler Emerald', price: 100000, rarity: 'gold' },
    { name: 'Butterfly Knife | Black Laminate', price: 120000, rarity: 'gold' },
    { name: 'M9 Bayonet | Emerald', price: 150000, rarity: 'gold' },
    { name: 'Karambit | Fade', price: 180000, rarity: 'gold' },
    { name: 'AWP | Gungnir', price: 200000, rarity: 'gold' },
    { name: 'M4A4 | Poseidon', price: 220000, rarity: 'gold' },
    { name: 'AK-47 | Fire Serpent', price: 250000, rarity: 'gold' },
    { name: 'Butterfly Knife | Doppler Phase 2', price: 35000, rarity: 'gold' },
    { name: 'Karambit | Doppler Phase 1', price: 40000, rarity: 'gold' },
    { name: 'M9 Bayonet | Doppler Phase 2', price: 45000, rarity: 'gold' },
    { name: 'Butterfly Knife | Ruby', price: 55000, rarity: 'gold' },
    { name: 'Karambit | Marble Fade', price: 75000, rarity: 'gold' }
];

// ===== ФУНКЦИЯ ЗАПОЛНЕНИЯ КЕЙСОВ =====
function populateCases() {
    CASES.forEach(caseItem => {
        const casePrice = caseItem.price;
        
        // Фильтруем скины по цене кейса (от 1% до 500% цены кейса)
        const minPrice = casePrice * 0.01;
        const maxPrice = casePrice * 5;
        
        const suitableSkins = SKINS_POOL.filter(s => 
            s.price >= minPrice && s.price <= maxPrice
        );

        // Перемешиваем
        suitableSkins.sort(() => Math.random() - 0.5);

        // Берём 20 скинов (или все если меньше)
        const selectedSkins = suitableSkins.slice(0, 20);

        // Если скинов меньше 20, добавляем из общего пула
        if (selectedSkins.length < 20) {
            const remaining = SKINS_POOL
                .filter(s => !selectedSkins.includes(s))
                .sort(() => Math.random() - 0.5)
                .slice(0, 20 - selectedSkins.length);
            selectedSkins.push(...remaining);
        }

        // Сортируем по цене
        selectedSkins.sort((a, b) => a.price - b.price);

        // Заменяем items в кейсе
        caseItem.items = selectedSkins.map(s => ({ ...s }));
    });
}