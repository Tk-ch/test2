// Game configuration
const CONFIG = {
    // Grid settings
    GRID_SIZE: 16,
    CELL_SIZE: 30,

    // Shape types
    SHAPES: {
        CIRCLE: 0,
        HEXAGON: 1,
        TRIANGLE: 2,
        TRAPEZIUM: 3
    },

    // Scoring
    POINTS_MULTIPLIER: 60,
    WIN_SCORE: 1000,

    // Colors for shapes
    COLORS: [
        '#FF5733', // Circle - Red/Orange
        '#33FF57', // Hexagon - Green
        '#3357FF', // Triangle - Blue
        '#FF33F5'  // Trapezium - Pink
    ],

    // Animation
    SWAP_ANIMATION_SPEED: 8,
    DROP_ANIMATION_SPEED: 10,
    ANIMATION_DELAY: 300
};
