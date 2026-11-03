# Kothar

Kothar is a browser-based word generator compatible with the pattern language and settings files of Awkwords 1.2. It is a distinct implementation, not the original Awkwords. No server or account is required.

Kothar takes its name from Kothar-wa-Khasis (Ugaritic: 𐎋𐎘𐎗𐎆𐎃𐎒𐎒; *Kôṯaru-wa-Ḫasisu*), an Ugaritic divine artisan associated with architecture, smithing, music, and magic. Some scholars consider the name to represent two gods, Kothar and Khasis, combined into one.

## Use

Open the site, define named subpatterns and a main pattern, then generate words. Slash-separated options, square and optional round brackets, weights, quoted literals, and fragment filters follow Awkwords syntax. The requested count is the number of attempts: filters and duplicate removal can reduce the number of words returned. Import and export use the `.awkw` format, including legacy Windows-1250 imports. See the [original help](https://github.com/nai888/awkwords/blob/master/help.html) for details.

For local development, serve the repository with any static HTTP server, for example `python3 -m http.server`, and open `http://localhost:8000`. Run tests with `npm test` (Node.js 18 or newer). There are no runtime dependencies.

## GitHub Pages

In repository settings, under **Pages → Build and deployment**, select **GitHub Actions**. Push to `main` to run the deployment workflow. The expected project URL is `https://phobez.github.io/kothar/`.

## Credits

Awkwords 1.2 was created by Petr Mejzlík. Its [source code](https://github.com/nai888/awkwords) and documentation were used as the compatibility reference. Its license permits use, distribution, and modification provided modified versions are clearly distinguished from the original; see [AWKWORDS-LICENSE](AWKWORDS-LICENSE).
