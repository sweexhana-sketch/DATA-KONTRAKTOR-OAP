import maybrat from "@/Logo/kabupaten maybrat.png";
import rajaAmpat from "@/Logo/kabupaten raja ampat.png";
import sorongSelatan from "@/Logo/kabupaten sorong selatan.png";
import sorong from "@/Logo/kabupaten sorong.png";
import tambrauw from "@/Logo/kabupaten tambrauw.png";
import kotaSorong from "@/Logo/kota sorong.png";
import pbd from "@/assets/logo-papua-barat-daya.png";

export const PROVINCE_LOGO = pbd;
export const CO_ADMIN_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Coat_of_arms_of_West_Papua.svg/500px-Coat_of_arms_of_West_Papua.svg.png"; // Papua Barat

export const WILAYAH_LOGOS = {
  'KOTA_SOR': kotaSorong,
  'KAB_SOR': sorong,
  'KAB_SORSEL': sorongSelatan,
  'KAB_MAY': maybrat,
  'KAB_TAM': tambrauw,
  'KAB_RA': rajaAmpat
};

export const ALL_LOGOS = [
  { id: 'pbd', src: pbd, alt: 'Papua Barat Daya', isProv: true },
  { id: 'KOTA_SOR', src: kotaSorong, alt: 'Kota Sorong' },
  { id: 'KAB_SOR', src: sorong, alt: 'Kabupaten Sorong' },
  { id: 'KAB_SORSEL', src: sorongSelatan, alt: 'Kabupaten Sorong Selatan' },
  { id: 'KAB_MAY', src: maybrat, alt: 'Kabupaten Maybrat' },
  { id: 'KAB_TAM', src: tambrauw, alt: 'Kabupaten Tambrauw' },
  { id: 'KAB_RA', src: rajaAmpat, alt: 'Kabupaten Raja Ampat' }
];

export function LogoRow({ className = "" }) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 flex-wrap ${className}`}>
      {ALL_LOGOS.map((l) => (
        <div key={l.id} className="relative group">
           <img
             src={l.src?.src || l.src}
             alt={l.alt}
             title={l.alt}
             className={`object-contain transition-all duration-300 drop-shadow-lg cursor-pointer ${l.isProv ? "w-12 h-12 sm:w-16 sm:h-16" : "w-10 h-10 sm:w-14 sm:h-14"} hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]`}
           />
        </div>
      ))}
    </div>
  );
}
