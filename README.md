# Hanterbart - WoW Alliance Guild Website

A React-based website for the Hanterbart World of Warcraft Alliance guild, featuring user authentication, a guild calendar, and member profiles.

## Features

- User Authentication with Firebase
- Guild Events Calendar
- Member Profiles
- Modern UI with Chakra UI
- Responsive Design

## Prerequisites

- Node.js (v18.17.1 or higher)
- npm (comes with Node.js)
- A Firebase project with Authentication enabled

## Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd hanterbart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   ```

   You can find these values in your Firebase project settings.

## Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Building for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Technologies Used

- React
- TypeScript
- Vite
- Chakra UI
- Firebase Authentication
- React Router
- React Big Calendar
- Date-fns
- Custom Fonts (Fira Sans & Cinzel)

## Project Structure

```
hanterbart/
├── src/
│   ├── components/     # React components
│   ├── App.tsx        # Main application component
│   ├── main.tsx       # Application entry point
│   └── firebase.ts    # Firebase configuration
├── public/            # Static assets
├── .env.example       # Example environment variables
└── package.json       # Project dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
