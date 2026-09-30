// iOS "liquid glass" theme overrides, merged into the base theme in App.jsx
// when glassEnabled (see utils/platform.js).

const blur = 'blur(18px) saturate(180%)';

const sheen = 'linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 48%, rgba(255,255,255,0) 100%)';
const edge = 'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.06)';

const pressed = { transform: 'scale(0.97)' };

const frostedSurface = {
  bg: 'rgba(255,255,255,0.72)',
  backdropFilter: blur,
  WebkitBackdropFilter: blur,
  boxShadow: '0 12px 40px -12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
  border: '1px solid rgba(255,255,255,0.6)',
};

export const glassTheme = {
  // "Curves": a rounder radius scale for inputs, cards, menus and modals.
  radii: {
    sm: '8px',
    base: '10px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
  },
  styles: {
    global: {
      body: { WebkitTapHighlightColor: 'transparent' },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'full',
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
        transition: 'transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease',
        _active: pressed,
      },
      variants: {
        solid: {
          backgroundImage: sheen,
          boxShadow: `${edge}, 0 6px 18px -8px rgba(0,0,0,0.35)`,
        },
        outline: {
          bg: 'rgba(255,255,255,0.14)',
          backgroundImage: sheen,
          boxShadow: `${edge}, 0 4px 14px -8px rgba(0,0,0,0.25)`,
        },
        ghost: {
          backgroundImage: sheen,
        },
      },
    },
    Menu: {
      baseStyle: {
        list: { ...frostedSurface, borderRadius: 'xl', overflow: 'hidden' },
      },
    },
    Popover: {
      baseStyle: {
        content: { ...frostedSurface, borderRadius: 'xl' },
      },
    },
    Modal: {
      baseStyle: {
        dialog: { borderRadius: '2xl' },
        overlay: { backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: { ...frostedSurface, bg: 'rgba(255,255,255,0.85)' },
        overlay: { backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' },
      },
    },
  },
};
