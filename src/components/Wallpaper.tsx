/** Wallpaper — fond d'ecran par defaut du bureau.
 *
 *  C'etait une scene « paper-garden » dessinee en CSS/SVG : collines, grain de
 *  papier, rangees de cultures. Elle restait visible derriere l'image de
 *  l'utilisateur des que celle-ci ne remplissait pas l'ecran — en `contain`, les
 *  bandes laterales montraient ces collines, ce qui donnait deux univers
 *  visuels superposes.
 *
 *  Le defaut est desormais la photo Solarpunk. Elle tient le role de fond
 *  neutre : en `cover` on ne la voit pas, en `contain` ou `repeat` elle
 *  encadre l'image choisie sans lui faire concurrence.
 *
 *  Aucun effet canvas-ui ici. Les effets appartiennent a chaque fenetre d'app
 *  (cf. la signature FX dans AppFrame.tsx) ; le bureau reste une scene fixe
 *  pour que ces effets portent sans couche concurrente.
 */
import solarpunk from '../assets/solarpunk-default.jpg';

export function Wallpaper(): import('react').ReactNode {
  return (
    <div
      className="fixed inset-0 z-[-10] overflow-hidden"
      style={{
        // Le degrade sous l'image sert pendant son chargement et sur les rares
        // formats d'ecran ou `cover` laisserait un liesere.
        background: 'linear-gradient(180deg, #eef1e6 0%, #e4ecd7 45%, #d7e6c3 100%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${solarpunk})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  );
}
