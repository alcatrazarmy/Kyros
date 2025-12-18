# Copilot Instructions for Kyros

## Project Overview

Kyros is an AI-powered dashboard featuring "NeonGlow Memory Core" - an advanced biometric memory bank for secure API token and project management. The system provides a holographic vault interface where tokens appear as pulsing neon orbs with comprehensive metadata, designed for managing OpenSolar projects.

**Key Technologies:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5.9+
- Tailwind CSS 4
- Framer Motion 12
- Lucide React (icons)

## Repository Structure

```
Kyros/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Global styles with Tailwind
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main application page
│   ├── components/
│   │   └── neonglow/          # NeonGlow components
│   │       ├── NeonOrb.tsx           # Animated token orb
│   │       ├── TokenCard.tsx         # Token card with controls
│   │       ├── TokenDetails.tsx      # Detailed token view
│   │       └── TokenVault.tsx        # Main vault interface
│   ├── services/
│   │   ├── tokenService.ts    # Token management service
│   │   └── openSolarService.ts # OpenSolar API integration
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── lib/
│       └── utils.ts           # Utility functions
├── public/                     # Static assets
├── .github/                    # GitHub configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Build & Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Testing
Currently, there is no test infrastructure in the repository. When adding tests:
- Follow Next.js testing best practices
- Use Jest and React Testing Library
- Place test files adjacent to components with `.test.tsx` or `.spec.tsx` extension

## Coding Conventions & Style

### TypeScript
- **Strict mode enabled**: All code must be type-safe
- **No implicit any**: Always provide explicit types
- **Interface over type**: Prefer `interface` for object types, `type` for unions/intersections
- **Export types**: All types defined in `src/types/index.ts` should be exported

### React Components
- **Functional components only**: Use hooks, no class components
- **TypeScript for all components**: Every component must have proper TypeScript typing
- **Props interface naming**: Use `ComponentNameProps` (e.g., `NeonOrbProps`)
- **Export pattern**: Use named exports for components
- **File naming**: PascalCase for component files (e.g., `TokenCard.tsx`)

### Styling
- **Tailwind-first**: Use Tailwind CSS utility classes
- **Custom theme**: Utilize the neon color palette defined in `tailwind.config.ts`
- **No inline styles**: Avoid style props unless absolutely necessary
- **Responsive design**: Mobile-first approach using Tailwind breakpoints
- **Dark theme**: The app uses a dark theme with neon accents

### Neon Theme Colors
```typescript
neon: {
  cyan: "#00FFFF",
  purple: "#B026FF",
  pink: "#FF10F0",
  green: "#39FF14",
  blue: "#4D4DFF",
  orange: "#FF6600",
}
```

### Animation
- **Framer Motion**: Use for all animations
- **Performance**: Prefer GPU-accelerated properties (transform, opacity)
- **Consistency**: Follow existing animation patterns in NeonOrb and TokenCard
- **Accessibility**: Respect `prefers-reduced-motion`

### File Organization
- **Component co-location**: Keep related components in the same directory
- **Service layer**: Business logic in `src/services/`
- **Type definitions**: Centralized in `src/types/index.ts`
- **Utilities**: Helper functions in `src/lib/utils.ts`

## Component Development Guidelines

### Creating New Components
1. Create file in appropriate directory (`src/components/` or `src/components/neonglow/`)
2. Define props interface with TypeScript
3. Implement component with proper typing
4. Use Tailwind for styling
5. Add Framer Motion animations if needed
6. Export component using named export

### Example Component Structure
```typescript
import { motion } from 'framer-motion';
import { ComponentProps } from '@/types';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <motion.div
      className="bg-black/50 border border-neon-cyan"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-neon-cyan">{title}</h2>
      <button onClick={onAction}>Action</button>
    </motion.div>
  );
}
```

## Security Guidelines

### Token Management
- **Always mask tokens**: Display only first and last 4 characters by default
- **Audit logging**: Log all token operations (create, rotate, revoke, access)
- **No hardcoded secrets**: Use environment variables for sensitive data
- **Secure exposure**: Require explicit user action to reveal full tokens

### API Integration
- **Input validation**: Validate all user inputs
- **Error handling**: Proper try-catch blocks with meaningful error messages
- **Rate limiting**: Consider implementing for production API calls
- **HTTPS only**: All API calls must use HTTPS

## Common Patterns

### State Management
- Use React hooks (`useState`, `useEffect`, etc.)
- Keep state as local as possible
- Lift state up only when necessary
- No global state library currently in use

### Data Fetching
- Client-side fetching in components
- Service layer abstracts API calls
- Mock data for development (see `tokenService.ts` and `openSolarService.ts`)

### Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error('Descriptive error message:', error);
  // Handle gracefully with user feedback
}
```

## Making Changes

### Before Starting
1. Run `npm install` to ensure dependencies are up to date
2. Run `npm run dev` to start the development server
3. Check `npm run lint` to understand current code quality

### During Development
1. Make minimal, focused changes
2. Follow existing code patterns and conventions
3. Maintain the neon/holographic visual theme
4. Test changes in the browser at http://localhost:3000
5. Run `npm run lint` to check for linting errors

### Before Committing
1. Verify code builds: `npm run build`
2. Fix any linting errors: `npm run lint`
3. Test functionality in the browser
4. Ensure no console errors or warnings

## Visual Design Principles

### Neon Aesthetic
- Dark backgrounds (black, dark gray)
- Bright neon accents for interactive elements
- Glowing effects on hover/active states
- Pulsing animations for active tokens
- Smooth transitions and animations

### Interaction Feedback
- Visual feedback for all user actions
- Ripple effects for clicks
- Color shifts for state changes
- Smooth transitions between states
- Loading indicators for async operations

## Performance Considerations

- **Code splitting**: Leverage Next.js automatic code splitting
- **Image optimization**: Use Next.js Image component for images
- **Lazy loading**: Load components on demand when possible
- **Animation performance**: Use `transform` and `opacity` for animations
- **Bundle size**: Avoid large dependencies unless necessary

## Documentation

- **Inline comments**: Only when necessary to explain complex logic
- **JSDoc comments**: For utility functions and services
- **README updates**: Update README.md if adding major features
- **Type documentation**: Use TypeScript types as primary documentation

## Important Notes

- This is a **visual showcase project** - maintain the high-quality neon aesthetic
- **No real authentication** - security features are demonstrative
- **Mock data** - OpenSolar integration uses mock data for demonstration
- **Client-side only** - No backend API currently implemented
- **Browser support** - Target modern browsers with ES6+ support

## Issue Guidelines

When working on issues:
- Understand the visual design intent
- Make minimal changes to achieve the goal
- Preserve the neon/holographic theme
- Test visual changes in the browser
- Maintain TypeScript type safety
- Follow existing animation patterns

## Questions or Unclear Requirements?

If an issue is unclear:
1. Check existing components for similar patterns
2. Review the README.md for context
3. Ask for clarification rather than making assumptions
4. Propose a solution for validation before implementing
