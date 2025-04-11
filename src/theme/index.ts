import { extendTheme } from '@chakra-ui/react';

export const themeNames = ['default', 'frost', 'ember', 'neon'] as const;
export type ThemeName = typeof themeNames[number];

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: 'background.primary',
        color: 'text.primary',
        fontFamily: props.theme.fonts.body,
      },
      '*': {
        fontFamily: 'inherit',
      },
    }),
  },
  components: {
    Container: {
      baseStyle: {
        maxW: 'container.xl',
        px: { base: 4, md: 6, lg: 8 },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
        letterSpacing: 'tight',
      },
      sizes: {
        '2xl': {
          fontSize: ['2xl', '3xl', '4xl'],
          lineHeight: 'shorter',
        },
        xl: {
          fontSize: ['xl', '2xl', '3xl'],
          lineHeight: 'shorter',
        },
        lg: {
          fontSize: ['lg', 'xl', '2xl'],
          lineHeight: 'shorter',
        },
      },
    },
    Text: {
      baseStyle: {
        fontFamily: 'Oxanium',
        lineHeight: 'tall',
      },
      variants: {
        secondary: {
          color: 'text.secondary',
          fontSize: 'sm',
        },
        muted: {
          color: 'text.secondary',
          fontSize: 'xs',
        },
      },
    },
    Button: {
      baseStyle: {
        fontFamily: 'Oxanium',
        fontWeight: "semibold",
        borderRadius: "md",
      },
    },
    Input: {
      baseStyle: {
        field: {
          fontFamily: 'Oxanium',
        },
      },
    },
    Textarea: {
      baseStyle: {
        fontFamily: 'Oxanium',
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          fontFamily: 'Oxanium',
        },
        header: {
          fontFamily: 'Oxanium',
        },
        body: {
          fontFamily: 'Oxanium',
        },
        footer: {
          fontFamily: 'Oxanium',
        },
      },
    },
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
    mono: 'JetBrains Mono',
    ui: (isNeonTheme: boolean) => isNeonTheme ? "'Chakra Petch', sans-serif" : "'DM Sans', sans-serif",
  },
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  lineHeights: {
    normal: 'normal',
    none: 1,
    shorter: 1.25,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
    taller: 2,
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
});

const defaultTheme = {
  colors: {
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
    background: {
      primary: '#171923',
      secondary: '#1A202C',
      tertiary: '#2D3748',
    },
    text: {
      primary: '#E2E8F0',
      secondary: '#A0AEC0',
    },
    border: {
      primary: '#2D3748',
      secondary: '#4A5568',
    },
  },
  shadows: {
    outline: '0 0 0 3px rgba(33, 150, 243, 0.6)',
    default: '0 0 10px rgba(33, 150, 243, 0.3), 0 0 20px rgba(33, 150, 243, 0.2)',
    defaultHover: '0 0 5px #2196F3, 0 0 15px #2196F3, 0 0 30px #2196F3',
  },
  styles: {
    global: (props: any) => ({
      '.nav-link': {
        color: 'text.primary !important',
        transition: 'all 0.3s ease',
        _hover: {
          textDecoration: 'none',
          color: 'primary.400 !important',
          textShadow: 'defaultHover',
        },
      },
      '.chakra-menu__menuitem': {
        _hover: {
          bg: 'background.tertiary !important',
          color: 'primary.400 !important',
          textShadow: 'defaultHover',
        },
      },
      '.nav-link:hover .chakra-icon, .chakra-menu__menuitem:hover .chakra-icon': {
        color: 'primary.400 !important',
        filter: 'drop-shadow(0 0 5px #2196F3)',
      },
    }),
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
            boxShadow: 'default',
          },
        },
        ghost: {
          _hover: {
            bg: 'transparent',
            color: 'primary.400',
            textShadow: 'defaultHover',
          },
        },
      },
    },
  },
};

const frostTheme = {
  colors: {
    primary: {
      50: '#EDF5FF',
      100: '#DBE8FF',
      200: '#B8D1FF',
      300: '#94B9FF',
      400: '#70A1FF',
      500: '#4C89FF',
      600: '#3870DB',
      700: '#2658B7',
      800: '#164193',
      900: '#082B7A',
    },
    background: {
      primary: '#1A1F2E',
      secondary: '#1E2538',
      tertiary: '#2A3349',
    },
    text: {
      primary: '#F0F4FF',
      secondary: '#B0BCDF',
    },
    border: {
      primary: '#2A3349',
      secondary: '#3A456A',
    },
  },
  shadows: {
    outline: '0 0 0 3px rgba(76, 137, 255, 0.6)',
    frost: '0 0 10px rgba(76, 137, 255, 0.3), 0 0 20px rgba(76, 137, 255, 0.2)',
    frostHover: '0 0 5px #4C89FF, 0 0 15px #4C89FF, 0 0 30px #4C89FF',
  },
  styles: {
    global: (props: any) => ({
      '.nav-link': {
        color: 'text.primary !important',
        transition: 'all 0.3s ease',
        _hover: {
          textDecoration: 'none',
          color: 'primary.400 !important',
          textShadow: 'frostHover',
        },
      },
      '.chakra-menu__menuitem': {
        _hover: {
          bg: 'background.tertiary !important',
          color: 'primary.400 !important',
          textShadow: 'frostHover',
        },
      },
      '.nav-link:hover .chakra-icon, .chakra-menu__menuitem:hover .chakra-icon': {
        color: 'primary.400 !important',
        filter: 'drop-shadow(0 0 5px #4C89FF)',
      },
    }),
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
            boxShadow: 'frost',
          },
        },
        ghost: {
          _hover: {
            bg: 'transparent',
            color: 'primary.400',
            textShadow: 'frostHover',
          },
        },
      },
    },
  },
};

const emberTheme = {
  colors: {
    primary: {
      50: '#FFF5ED',
      100: '#FFE6D5',
      200: '#FFD0AC',
      300: '#FFB582',
      400: '#FF9A59',
      500: '#FF7E2F',
      600: '#DB6420',
      700: '#B74B14',
      800: '#93340B',
      900: '#7A2004',
    },
    background: {
      primary: '#1F1A1A',
      secondary: '#251E1E',
      tertiary: '#362929',
    },
    text: {
      primary: '#FFF0E8',
      secondary: '#DFBDB0',
    },
    border: {
      primary: '#362929',
      secondary: '#4D3939',
    },
  },
  shadows: {
    outline: '0 0 0 3px rgba(255, 126, 47, 0.6)',
    ember: '0 0 10px rgba(255, 126, 47, 0.3), 0 0 20px rgba(255, 126, 47, 0.2)',
    emberHover: '0 0 5px #FF7E2F, 0 0 15px #FF7E2F, 0 0 30px #FF7E2F',
  },
  styles: {
    global: (props: any) => ({
      '.nav-link': {
        color: 'text.primary !important',
        transition: 'all 0.3s ease',
        _hover: {
          textDecoration: 'none',
          color: 'primary.400 !important',
          textShadow: 'emberHover',
        },
      },
      '.chakra-menu__menuitem': {
        _hover: {
          bg: 'background.tertiary !important',
          color: 'primary.400 !important',
          textShadow: 'emberHover',
        },
      },
      '.nav-link:hover .chakra-icon, .chakra-menu__menuitem:hover .chakra-icon': {
        color: 'primary.400 !important',
        filter: 'drop-shadow(0 0 5px #FF7E2F)',
      },
    }),
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
            boxShadow: 'ember',
          },
        },
        ghost: {
          _hover: {
            bg: 'transparent',
            color: 'primary.400',
            textShadow: 'emberHover',
          },
        },
      },
    },
  },
};

const neonTheme = {
  colors: {
    primary: {
      50: '#E2FFEA',
      100: '#C3FFD6',
      200: '#85FFB1',
      300: '#47FF8C',
      400: '#1FFF6E',
      500: '#011407',
      600: '#00B542',
      700: '#009437',
      800: '#00732C',
      900: '#005A23',
    },
    background: {
      primary: '#0A0F0A',
      secondary: '#121712',
      tertiary: '#1A231A',
      overlay: 'rgba(0, 224, 80, 0.1)',
    },
    text: {
      primary: '#E2FFE4',
      secondary: '#85FFB1',
    },
    border: {
      primary: '#1A231A',
      secondary: '#243324',
    },
  },
  fonts: {
    heading: 'Orbitron',
    body: 'Inter',
    mono: 'JetBrains Mono',
  },
  shadows: {
    outline: '0 0 0 3px rgba(0, 224, 80, 0.6)',
    neon: '0 0 10px rgba(0, 224, 80, 0.3), 0 0 20px rgba(0, 224, 80, 0.2)',
    neonHover: '0 0 5px #00E050, 0 0 15px #00E050, 0 0 30px #00E050',
    neonButtonHover: '0 0 5px #00E050, 0 0 10px #00E050, 0 0 20px #00E050',
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: 'Chakra Petch',
      },
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
            boxShadow: 'neon',
          },
        },
        ghost: {
          _hover: {
            bg: 'transparent',
            color: 'primary.400',
            textShadow: 'neonHover',
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: 'Orbitron',
      },
    },
    Text: {
      baseStyle: {
        fontFamily: 'inherit',
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          fontFamily: 'inherit',
        },
        header: {
          fontFamily: 'Orbitron',
        },
        body: {
          fontFamily: 'inherit',
        },
        footer: {
          fontFamily: 'inherit',
        },
      },
    },
    Link: {
      baseStyle: (props: any) => ({
        position: 'relative',
        color: 'text.primary',
        transition: 'all 0.3s ease',
        _hover: {
          textDecoration: 'none',
          color: 'primary.400',
          textShadow: 'neonHover',
        },
      }),
      variants: {
        nav: {
          fontSize: 'md',
          fontWeight: 'medium',
          padding: '2',
          _hover: {
            textDecoration: 'none',
            color: 'primary.400',
            textShadow: 'neonHover',
          },
        },
      },
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: 'background.primary',
        color: 'text.primary',
        fontFamily: 'Inter',
      },
      'h1, h2, h3, h4, h5, h6': {
        fontFamily: 'Orbitron',
      },
      'button': {
        fontFamily: 'Chakra Petch',
      },
      'input, textarea, p, span, div': {
        fontFamily: 'inherit',
      },
      '.chakra-modal__content *': {
        fontFamily: 'inherit',
      },
      '.nav-link': {
        color: 'text.primary',
        transition: 'all 0.3s ease',
        _hover: {
          textDecoration: 'none',
          color: 'primary.400',
          textShadow: 'neonHover',
        },
      },
      '.nav-link.active': {
        color: 'primary.400',
        textShadow: 'neonHover',
      },
      '.nav-link, .chakra-menu__menu-button, .chakra-button, .chakra-menu__menuitem': {
        transition: 'all 0.3s ease !important',
        position: 'relative',
        _hover: {
          textDecoration: 'none',
          color: 'primary.400 !important',
          textShadow: 'neonHover',
          bg: 'transparent !important',
          _before: {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 'md',
            pointerEvents: 'none',
            boxShadow: 'neonButtonHover',
            opacity: 0.5,
          },
        },
      },
      '.chakra-menu__menuitem': {
        _hover: {
          bg: 'background.tertiary !important',
          color: 'primary.400 !important',
          textShadow: 'neonHover',
          _before: {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 'md',
            pointerEvents: 'none',
            boxShadow: 'neonButtonHover',
            opacity: 0.3,
          },
        },
      },
      '.chakra-icon': {
        transition: 'all 0.3s ease',
      },
      '.nav-link:hover .chakra-icon, .chakra-menu__menuitem:hover .chakra-icon': {
        color: 'primary.400 !important',
        filter: 'drop-shadow(0 0 5px #00E050)',
      },
    }),
  },
};

export const themes = {
  default: extendTheme(defaultTheme),
  frost: extendTheme(frostTheme),
  ember: extendTheme(emberTheme),
  neon: extendTheme(neonTheme),
}; 