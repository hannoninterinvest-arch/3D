# Quatre faces — GLB

Application Next.js qui construit un objet 3D à partir de quatre images (avant, droite, arrière, gauche) et le télécharge au format GLB.

Le dessus et le dessous, absents des quatre photos, reçoivent une couleur unie. Tout le traitement reste dans le navigateur : les images ne sont pas envoyées à un serveur.

## Lancer

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000), déposez les quatre faces, ajustez les dimensions, puis téléchargez `objet-4-faces.glb`.
