// Rôle grade
const RoleIds = {
    mercenaire: {
        baseRoleId: '1202575640159588382', // Ajoutez l'ID réel du rôle de base mercenaire ici
        grades: [
            { threshold: 10000, id: '1224315067445542922', name: 'Mercenaire Grade 5' },
            { threshold: 7000, id: '1224315097871290459', name: 'Mercenaire Grade 4' },
            { threshold: 4000, id: '1224315031215145010', name: 'Mercenaire Grade 3' },
            { threshold: 1000, id: '1224315030690856961', name: 'Mercenaire Grade 2' },
            { threshold: 50, id: '1224314494466129920', name: 'Mercenaire Grade 1' }
        ],
    },
    landowner: {
        baseRoleId: '1202574648911601675', // Ajoutez l'ID réel du rôle de base landowner ici
        grades: [
            { threshold: 100000, id: '1236312614615650375', name: 'Landowner Grade 9' },
            { threshold: 28000, id: '1236310896305897483', name: 'Landowner Grade 8' },
            { threshold: 22000, id: '1236310612544589916', name: 'Landowner Grade 7' },
            { threshold: 16000, id: '1236309796219650099', name: 'Landowner Grade 6' },
            { threshold: 10000, id: '1224316082928619551', name: 'Landowner Grade 5' },
            { threshold: 7000, id: '1224316083071221911', name: 'Landowner Grade 4' },
            { threshold: 4000, id: '1224316079707394078', name: 'Landowner Grade 3' },
            { threshold: 1000, id: '1224316076431511562', name: 'Landowner Grade 2' },
            { threshold: 50, id: '1224316038456283166', name: 'Landowner Grade 1' }
        ],
    }
};

module.exports = RoleIds;