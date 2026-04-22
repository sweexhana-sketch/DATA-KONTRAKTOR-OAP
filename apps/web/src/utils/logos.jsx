import maybrat from "@/Logo/kabupaten maybrat.png";
import rajaAmpat from "@/Logo/kabupaten raja ampat.png";
import sorongSelatan from "@/Logo/kabupaten sorong selatan.png";
import sorong from "@/Logo/kabupaten sorong.png";
import tambrauw from "@/Logo/kabupaten tambrauw.png";
import kotaSorong from "@/Logo/kota sorong.png";
import pbd from "@/assets/logo-papua-barat-daya.png";

export const PROVINCE_LOGO = pbd;

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
    <div className={`flex items-center gap-2 sm:gap-3 flex-wrap ${className}`}>
      {ALL_LOGOS.map((l) => (
        <img
          key={l.id}
          src={l.src.src || l.src}
          alt={l.alt}
          title={l.alt}
          className={`object-contain bg-white/5 rounded-md p-0.5 border border-white/10 ${l.isProv ? "w-8 h-8 sm:w-10 sm:h-10 border-amber-500/30" : "w-6 h-6 sm:w-8 sm:h-8"} hover:scale-110 transition-transform`}
        />
      ))}
    </div>
  );
}
