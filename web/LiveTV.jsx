import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VideoPlexPlayer from './components/player/VideoPlexPlayer.jsx';

const API_DEFAULT = 'http://localhost:4000';
const HEALTH_REFRESH_MS = 30 * 60 * 1000;
function apiBase(){return String(import.meta.env.VITE_API_URL||localStorage.getItem('videoplex_api_url')||API_DEFAULT).replace(/\/$/,'');}
function initials(name=''){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'TV';}
function countryFlag(country=''){const map={Nigeria:'🇳🇬',Ghana:'🇬🇭',Kenya:'🇰🇪',South_Africa:'🇿🇦','South Africa':'🇿🇦',United_States:'🇺🇸','United States':'🇺🇸',Canada:'🇨🇦',United_Kingdom:'🇬🇧','United Kingdom':'🇬🇧',France:'🇫🇷',Germany:'🇩🇪',Italy:'🇮🇹',Spain:'🇪🇸',Portugal:'🇵🇹',Brazil:'🇧🇷',Argentina:'🇦🇷',Mexico:'🇲🇽',India:'🇮🇳',Japan:'🇯🇵',South_Korea:'🇰🇷','South Korea':'🇰🇷',Australia:'🇦🇺',New_Zealand:'🇳🇿',Turkey:'🇹🇷',Egypt:'🇪🇬',Morocco:'🇲🇦',Algeria:'🇩🇿',Angola:'🇦🇴',Austria:'🇦🇹',Belgium:'🇧🇪',Botswana:'🇧🇼',Cameroon:'🇨🇲',China:'🇨🇳',Colombia:'🇨🇴',Croatia:'🇭🇷',Cuba:'🇨🇺',Czechia:'🇨🇿',Denmark:'🇩🇰',Ethiopia:'🇪🇹',Finland:'🇫🇮',Greece:'🇬🇷',Hungary:'🇭🇺',Indonesia:'🇮🇩',Ireland:'🇮🇪',Israel:'🇮🇱',Jamaica:'🇯🇲',Jordan:'🇯🇴',Lebanon:'🇱🇧',Malaysia:'🇲🇾',Malta:'🇲🇹',Namibia:'🇳🇦',Netherlands:'🇳🇱',Norway:'🇳🇴',Pakistan:'🇵🇰',Peru:'🇵🇪',Philippines:'🇵🇭',Poland:'🇵🇱',Romania:'🇷🇴',Russia:'🇷🇺',Rwanda:'🇷🇼',Senegal:'🇸🇳',Serbia:'🇷🇸',Singapore:'🇸🇬',Slovakia:'🇸🇰',Slovenia:'🇸🇮',Somalia:'🇸🇴',Sweden:'🇸🇪',Switzerland:'🇨🇭',Tanzania:'🇹🇿',Thailand:'🇹🇭',Tunisia:'🇹🇳',Uganda:'🇺🇬',Ukraine:'🇺🇦',United_Arab_Emirates:'🇦🇪','United Arab Emirates':'🇦🇪',Uruguay:'🇺🇾',Venezuela:'🇻🇪',Vietnam:'🇻🇳',Zambia:'🇿🇲',Zimbabwe:'🇿🇼',International:'🌐'};return map[String(country).trim()]||'🌐';}
const FLAG_CODE_MAP={Nigeria:'ng',Ghana:'gh',Kenya:'ke','South Africa':'za',South_Africa:'za','United States':'us',United_States:'us',Canada:'ca','United Kingdom':'gb',United_Kingdom:'gb',France:'fr',Germany:'de',Italy:'it',Spain:'es',Portugal:'pt',Brazil:'br',Argentina:'ar',Mexico:'mx',India:'in',Japan:'jp','South Korea':'kr',South_Korea:'kr',Australia:'au','New Zealand':'nz',New_Zealand:'nz',Turkey:'tr',Egypt:'eg',Morocco:'ma',Algeria:'dz',Angola:'ao',Austria:'at',Belgium:'be',Botswana:'bw',Cameroon:'cm',China:'cn',Colombia:'co',Croatia:'hr',Cuba:'cu',Czechia:'cz','Czech Republic':'cz',Denmark:'dk',Ethiopia:'et',Finland:'fi',Greece:'gr',Hungary:'hu',Indonesia:'id',Ireland:'ie',Israel:'il',Jamaica:'jm',Jordan:'jo',Lebanon:'lb',Malaysia:'my',Malta:'mt',Namibia:'na',Netherlands:'nl',Norway:'no',Pakistan:'pk',Peru:'pe',Philippines:'ph',Poland:'pl',Romania:'ro',Russia:'ru',Rwanda:'rw',Senegal:'sn',Serbia:'rs',Singapore:'sg',Slovakia:'sk',Slovenia:'si',Somalia:'so',Sweden:'se',Switzerland:'ch',Tanzania:'tz',Thailand:'th',Tunisia:'tn',Uganda:'ug',Ukraine:'ua','United Arab Emirates':'ae',United_Arab_Emirates:'ae',Uruguay:'uy',Venezuela:'ve',Vietnam:'vn',Zambia:'zm',Zimbabwe:'zw',Nigeria:'ng',International:''};
const FLAG_CODE_OVERRIDES={'United States of America':'us','North Korea':'kp','Saudi Arabia':'sa','Ivory Coast':'ci','Cote d’Ivoire':'ci','Côte d’Ivoire':'ci','Democratic Republic of the Congo':'cd','Republic of the Congo':'cg','East Timor':'tl','Myanmar':'mm','Taiwan':'tw','Hong Kong':'hk','Macau':'mo'};
function countryFlagCode(country=''){const name=String(country).trim();if(/^[A-Za-z]{2}$/.test(name))return name.toLowerCase();return FLAG_CODE_OVERRIDES[name]||FLAG_CODE_MAP[name]||FLAG_CODE_MAP[name.replace(/_/g,' ')]||'';}
function countryFlagUrl(country=''){const code=countryFlagCode(country);return code?`https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/flags/4x3/${code}.svg`:'';}
function CountryFlagImage({country,className=''}){const[url,setUrl]=useState(()=>countryFlagUrl(country));useEffect(()=>setUrl(countryFlagUrl(country)),[country]);if(!url)return <span className={`iptv-country-flag-fallback ${className}`}>{countryFlag(country)}</span>;return <img className={`iptv-country-flag-img ${className}`} src={url} alt={`${country} flag`} loading="lazy" referrerPolicy="no-referrer" onError={()=>setUrl('')}/>;}

function LivePlayer({channel,onClose}) {
  const source = channel.type === 'hls'
    ? `${apiBase()}/api/iptv/proxy?url=${encodeURIComponent(channel.streamUrl)}`
    : channel.streamUrl;

  return (
    <div className="iptv-modal" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="iptv-player-card">
        <div className="iptv-player-head">
          <div>
            <div className="iptv-live-pill"><span/> LIVE TV</div>
            <div className="iptv-player-title">{channel.name}</div>
          </div>
          <button type="button" className="btn bg" onClick={onClose}>Close</button>
        </div>
        <VideoPlexPlayer
          src={source}
          type={channel.type || 'hls'}
          title={channel.name}
          isLive
        />
        <div className="iptv-player-meta">
          <div className="iptv-logo-small">
            {channel.logo ? <img src={channel.logo} alt="" /> : initials(channel.name)}
          </div>
          <div>
            <div className="iptv-player-name">{countryFlag(channel.country)} {channel.name}</div>
            <div className="iptv-player-sub">{channel.country || 'International'}{channel.category ? ` · ${channel.category}` : ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveTV({apiUrl}){const base=useMemo(()=>(apiUrl||apiBase()).replace(/\/$/,''),[apiUrl]);const[channels,setChannels]=useState([]),[countries,setCountries]=useState([]),[categories,setCategories]=useState([]),[q,setQ]=useState(''),[country,setCountry]=useState(''),[category,setCategory]=useState(''),[countryOpen,setCountryOpen]=useState(false),[offset,setOffset]=useState(0),[hasMore,setHasMore]=useState(true),[loading,setLoading]=useState(true),[error,setError]=useState(''),[active,setActive]=useState(null),[health,setHealth]=useState({}),[checking,setChecking]=useState({});const countryRef=useRef(null);
  const checkChannels=useCallback(async(list=channels)=>{if(!list.length)return;const visible=list.slice(-30);setChecking(v=>{const n={...v};visible.forEach(c=>{n[c.id]=true;});return n;});await Promise.all(visible.map(async c=>{try{const r=await fetch(`${base}/api/iptv/health?url=${encodeURIComponent(c.streamUrl)}&type=${encodeURIComponent(c.type)}`);const d=await r.json();setHealth(v=>({...v,[c.id]:Boolean(d.active)}));}catch{setHealth(v=>({...v,[c.id]:false}));}finally{setChecking(v=>({...v,[c.id]:false}));}}));},[base,channels]);
  const load=useCallback(async(reset=false)=>{setLoading(true);setError('');const next=reset?0:offset;try{const p=new URLSearchParams({limit:'30',offset:String(next),type:'hls'});if(q.trim())p.set('q',q.trim());if(country)p.set('country',country);if(category)p.set('category',category);const r=await fetch(`${base}/api/iptv/channels?${p}`);if(!r.ok)throw new Error('Unable to load live TV channels.');const d=await r.json();const nextChannels=reset?d.items:[...channels,...d.items];setChannels(nextChannels);setCountries(d.countries||[]);setCategories(d.categories||[]);setHasMore(Boolean(d.hasMore));setOffset(next+d.items.length);if(reset)setHealth({});}catch(e){setError(e?.message||'Unable to load live TV channels.');}finally{setLoading(false);}},[base,q,country,category,offset,channels]);
  useEffect(()=>{const t=setTimeout(()=>load(true),250);return()=>clearTimeout(t);},[base,q,country,category]);
  useEffect(()=>{const close=e=>{if(countryRef.current&&!countryRef.current.contains(e.target))setCountryOpen(false);};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close);},[]);
  useEffect(()=>{if(channels.length)checkChannels(channels);},[base,channels,checkChannels]);
  useEffect(()=>{const interval=setInterval(()=>{checkChannels(channels);},HEALTH_REFRESH_MS);return()=>clearInterval(interval);},[checkChannels,channels]);
  const availableChannels=channels.filter(channel=>health[channel.id]===true);
  const healthChecksComplete=channels.length>0&&channels.every(channel=>Object.prototype.hasOwnProperty.call(health,channel.id));
  return <section className="iptv-section"><div className="iptv-heading"><div><div className="iptv-kicker"><span/> LIVE TV</div><h2>Watch live channels</h2><p>Browse live television from around the world, right inside Videoplex.</p></div><div className="iptv-count">{availableChannels.length}{hasMore?'+':''} available channels</div></div><div className="iptv-controls"><div className="iptv-search"><span>⌕</span><input value={q} onChange={e=>{setQ(e.target.value);setOffset(0);}} placeholder="Search live channels…"/></div><div className="iptv-country-select" ref={countryRef}><button type="button" className={`iptv-select-button ${countryOpen?'is-open':''}`} onClick={()=>setCountryOpen(v=>!v)}><span className="iptv-select-value"><CountryFlagImage country={country||'International'}/><span>{country||'All countries'}</span></span><span className="iptv-select-chevron">⌄</span></button>{countryOpen&&<div className="iptv-country-menu"><button type="button" className={`iptv-country-option ${!country?'selected':''}`} onClick={()=>{setCountry('');setOffset(0);setCountryOpen(false);}}><CountryFlagImage country="International"/><span>All countries</span></button>{countries.map(x=><button type="button" className={`iptv-country-option ${country===x?'selected':''}`} key={x} onClick={()=>{setCountry(x);setOffset(0);setCountryOpen(false);}}><CountryFlagImage country={x}/><span>{x.replace(/_/g,' ')}</span></button>)}<a className="iptv-flag-credit" href="https://flagicons.lipis.dev/" target="_blank" rel="noreferrer">SVG flags by Flag Icons</a></div>}</div><select value={category} onChange={e=>{setCategory(e.target.value);setOffset(0);}}><option value="">All categories</option>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select></div>{loading&&!channels.length&&<div className="iptv-state"><div className="spinner"/><div>Loading live channels…</div></div>}{error&&<div className="errbanner">⚠ {error}<button className="btn bg" onClick={()=>load(true)}>Try again</button></div>}{!loading&&!error&&!channels.length&&<div className="iptv-state"><div style={{fontSize:28}}>📺</div><div>No live channels matched your search.</div></div>}{!loading&&!error&&channels.length>0&&healthChecksComplete&&!availableChannels.length&&<div className="iptv-state"><div style={{fontSize:28}}>📺</div><div>No available live channels matched your search.</div><small>Unavailable or dead streams were removed from the cards. Videoplex will automatically re-check them every 30 minutes.</small></div>}{availableChannels.length>0&&<div className="iptv-grid">{availableChannels.map(channel=>{return <button key={channel.id} className="iptv-card" onClick={()=>setActive(channel)}><div className="iptv-thumb">{channel.logo?<img src={channel.logo} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/>:<div className="iptv-fallback-logo">{initials(channel.name)}</div>}<div className="iptv-thumb-shade"/><div className="iptv-live-badge is-active"><span/>ACTIVE</div><div className="iptv-play">▶</div></div><div className="iptv-info"><div className="iptv-channel-avatar">{channel.logo?<img src={channel.logo} alt="" loading="lazy"/>:initials(channel.name)}</div><div className="iptv-copy"><div className="iptv-name">{channel.name}</div><div className="iptv-sub">{countryFlag(channel.country)} {channel.country||'International'}{channel.category?` · ${channel.category}`:''}</div></div></div></button>})}</div>}{hasMore&&!loading&&channels.length>0&&<div className="iptv-more"><button className="btn bg" onClick={()=>load(false)}>Load more channels</button></div>}{loading&&channels.length>0&&<div className="iptv-more"><div className="spinner"/></div>}{active&&<LivePlayer channel={active} onClose={()=>setActive(null)}/>}</section>;
}
