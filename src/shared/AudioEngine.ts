type SfxKey = 'in' | 'out' | 'click';

type AudioListener = () => void;

interface AudioState {
  playing: boolean;
  currentTime: number;
  duration: number;
  title: string;
  volume: number;
}

class AudioEngine {
  private aud: HTMLAudioElement | null = null;
  private _playing = false;
  private _volume = 0.7;
  private _title = '-- KEIN TRACK --';

  private sfx: Record<SfxKey, HTMLAudioElement | null> = { in: null, out: null, click: null };
  private sfxNames: Record<SfxKey, string> = { in: 'slide_in.mp3', out: 'slide_out.mp3', click: 'click.mp3' };
  private sfxLoaded: Record<SfxKey, boolean> = { in: false, out: false, click: false };

  private listeners = new Set<AudioListener>();
  private sfxListeners = new Set<AudioListener>();
  private sfxPlayingDots: Record<SfxKey, boolean> = { in: false, out: false, click: false };

  private musicStarted = false;
  private autoplayBound = false;

  constructor() {
    this.autoLoadMusic();
    this.autoLoadSfx();
    this.setupAutoplay();
  }

  private emit() {
    this.listeners.forEach(fn => fn());
  }

  private emitSfx() {
    this.sfxListeners.forEach(fn => fn());
  }

  subscribe(fn: AudioListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  subscribeSfx(fn: AudioListener): () => void {
    this.sfxListeners.add(fn);
    return () => this.sfxListeners.delete(fn);
  }

  getState(): AudioState {
    return {
      playing: this._playing,
      currentTime: this.aud?.currentTime ?? 0,
      duration: this.aud?.duration ?? 0,
      title: this._title,
      volume: this._volume,
    };
  }

  getSfxState() {
    return {
      loaded: { ...this.sfxLoaded },
      names: { ...this.sfxNames },
      playing: { ...this.sfxPlayingDots },
    };
  }

  loadAudio(src: string, name: string) {
    if (this.aud) {
      this.aud.pause();
      this.aud = null;
    }
    this._playing = false;
    const a = new Audio(src);
    a.volume = this._volume;
    this.aud = a;
    this._title = name.toUpperCase().replace(/\.[^.]+$/, '');

    a.addEventListener('timeupdate', () => this.emit());
    a.addEventListener('loadedmetadata', () => this.emit());
    a.addEventListener('ended', () => {
      this._playing = false;
      this.emit();
    });

    this.emit();
  }

  private autoLoadMusic() {
    const t = new Audio('music.mp3');
    t.addEventListener('canplaythrough', () => {
      this.loadAudio('music.mp3', 'music');
    }, { once: true });
    t.addEventListener('error', () => {}, { once: true });
    t.load();
  }

  private setupAutoplay() {
    if (this.autoplayBound) return;
    this.autoplayBound = true;
    const start = () => {
      if (this.musicStarted || !this.aud) return;
      this.musicStarted = true;
      setTimeout(() => {
        this.aud?.play().then(() => {
          this._playing = true;
          this.emit();
        }).catch(() => { this.musicStarted = false; });
      }, 200);
      document.removeEventListener('click', start);
      document.removeEventListener('keydown', start);
    };
    document.addEventListener('click', start);
    document.addEventListener('keydown', start);
  }

  togglePlay() {
    if (!this.aud) return;
    if (this._playing) {
      this.aud.pause();
      this._playing = false;
    } else {
      this.aud.play().catch(() => {});
      this._playing = true;
    }
    this.emit();
  }

  setVolume(v: number) {
    this._volume = v;
    if (this.aud) this.aud.volume = v;
    this.emit();
  }

  seek(fraction: number) {
    if (!this.aud || !this.aud.duration) return;
    this.aud.currentTime = fraction * this.aud.duration;
  }

  loadFile(file: File) {
    this.loadAudio(URL.createObjectURL(file), file.name);
    if (!this._playing) this.togglePlay();
  }

  // SFX
  private autoLoadSfx() {
    const map: Record<SfxKey, string> = { in: 'slide_in.mp3', out: 'slide_out.mp3', click: 'click.mp3' };
    (Object.keys(map) as SfxKey[]).forEach(k => {
      this.sfxLoad(k, map[k], map[k]);
    });
  }

  sfxLoad(k: SfxKey, src: string, name: string) {
    const a = new Audio(src);
    a.volume = 0.55;
    a.addEventListener('canplaythrough', () => {
      this.sfx[k] = a;
      this.sfxLoaded[k] = true;
      this.sfxNames[k] = name;
      this.emitSfx();
    }, { once: true });
    a.addEventListener('error', () => {}, { once: true });
    a.load();
  }

  sfxPlay(k: SfxKey) {
    if (!this.sfx[k]) return;
    const a = this.sfx[k]!.cloneNode() as HTMLAudioElement;
    a.volume = 0.55;
    this.sfxPlayingDots[k] = true;
    this.emitSfx();
    a.play().catch(() => {});
    a.addEventListener('ended', () => {
      this.sfxPlayingDots[k] = false;
      this.emitSfx();
    });
  }

  sfxLoadFile(k: SfxKey, file: File) {
    this.sfxLoad(k, URL.createObjectURL(file), file.name);
  }
}

export const audioEngine = new AudioEngine();
export type { SfxKey };
