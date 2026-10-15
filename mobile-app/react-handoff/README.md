# Choosepure — React + Tailwind Handoff

A production-ready component package for the Choosepure mobile app. Drop into any Vite / Next.js / CRA project.

## Stack

- React 18+
- Tailwind CSS 3.4+
- No external UI library — all components are custom and own their markup

## Setup

1. Copy this folder into your project (e.g. `src/choosepure/`)
2. Merge `tailwind.config.js` with your existing config — the `theme.extend` block is the only thing you need
3. Import `./styles/globals.css` once at the app root (it pulls in Fraunces + Inter from Google Fonts and exposes the design tokens as CSS variables)
4. Drop the logo PNG into your public/ folder at `/choosepure-logo.png`

```jsx
// App.jsx
import './choosepure/styles/globals.css'
import HomeScreen from './choosepure/screens/HomeScreen'

export default function App() {
  return <HomeScreen />
}
```

## File map

```
react-handoff/
├── README.md                       (this file)
├── tailwind.config.js              Design tokens as Tailwind theme
├── styles/
│   └── globals.css                 CSS vars + base styles + font imports
├── tokens/
│   └── index.js                    Plain JS export of the same tokens
├── components/                     Reusable atoms & molecules
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Icon.jsx
│   ├── ScoreBadge.jsx
│   ├── NutriGradeBadge.jsx
│   ├── StatusBar.jsx
│   ├── TabBar.jsx
│   ├── PhoneFrame.jsx
│   ├── ProductCard.jsx
│   └── Dropdown.jsx
└── screens/                        Full mobile screens
    ├── OnboardingScreen.jsx
    ├── LoginScreen.jsx
    ├── SignupScreen.jsx
    ├── OTPScreen.jsx
    ├── HomeScreen.jsx
    ├── ScannerScreen.jsx
    ├── ProductDetailScreen.jsx
    ├── LabReportScreen.jsx
    ├── DiscoverScreen.jsx
    ├── NutriGradeListScreen.jsx
    ├── PlansScreen.jsx
    ├── ReferralScreen.jsx
    ├── VoteScreen.jsx
    └── ProfileScreen.jsx
```

## Routing

Screens accept a `navigate(routeName, params?)` prop so you can wire them to react-router, Next.js router, or any state machine. Example with react-router:

```jsx
import { useNavigate } from 'react-router-dom'
import HomeScreen from './choosepure/screens/HomeScreen'

function HomeRoute() {
  const navigate = useNavigate()
  return <HomeScreen navigate={(route, params) => navigate(`/${route}`, { state: params })} />
}
```

## Design tokens at a glance

| Token | Value | Use |
|---|---|---|
| `green-800` | `#226342` | Primary brand, headings, primary button |
| `green-700` | `#2D7A52` | Active states, score-good |
| `green-50`  | `#EDF3EE` | Soft backgrounds, hero gradients |
| `cream-50`  | `#F5F7F4` | App background |
| `text`      | `#1A201A` | Body text |
| `text-muted`| `#6B7268` | Secondary text |
| `border`    | `#ECEAE4` | Card borders, dividers |
| Nutri A | `#1E8449` | Score A (Excellent) |
| Nutri B | `#7CB342` | Score B (Good) |
| Nutri C | `#F4C430` | Score C (Fair) |
| Nutri D | `#E89B3C` | Score D (Poor) |
| Nutri E | `#D14E36` | Score E (Avoid) |

Typography: **Fraunces** for display + numerics, **Inter** for UI.

See `tokens/index.js` for the full set.
