
const URL =
  window.SUPABASE_URL || "YOUR_URL";

const KEY =
  window.SUPABASE_ANON_KEY || "YOUR_KEY";


const sb =
  (URL.startsWith("http") &&
   !URL.includes("YOUR_"))
  ? supabase.createClient(URL, KEY)
  : null;


const subjects = [
  "English",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Geography",
  "History",
  "Civics",
  "Economics",
  "Aptitude (SAT)"
];


const icons = [
  "📖",
  "📐",
  "⚡",
  "🧪",
  "🧬",
  "🌍",
  "🏛️",
  "⚖️",
  "📊",
  "🧠"
];


let qs = [];
let user = null;
let idx = 0;
let chosen = null;
let correct = 0;
let solved = 0;
let mode = "practice";
let pool = [];


const $ =
  x => document.getElementById(x);


const show =
  x =>
  ["login","home","exam","boardview","profileview"]
  .forEach(
    y =>
    $(y).classList.toggle("hide", y !== x)
  );


async function init(){

  qs =
    await fetch("questions.json")
      .then(r => r.json())
      .catch(() => []);


  $("subjects").innerHTML =
    subjects
      .map(
        (s,i) =>
        `<button class="subject"
          onclick="start('${s}')">
          ${icons[i]}
          <b>${s}</b>
          <small>Practice →</small>
        </button>`
      )
      .join("");


  if(sb){

    let s =
      (await sb.auth.getSession())
      .data.session;


    if(s){

      user = s.user;

      dash();

    }else{

      show("login");

    }


    sb.auth.onAuthStateChange(
      (_e,s) => {

        user = s?.user || null;

        if(user)
          dash();

      }
    );

  }else{

    show("login");

  }

}


let signup = false;


$("lt").onclick = () => {

  signup = false;

  $("lt").classList.add("on");

  $("st").classList.remove("on");

  $("name").classList.add("hide");

  $("auth").textContent = "Login";

};


$("st").onclick = () => {

  signup = true;

  $("st").classList.add("on");

  $("lt").classList.remove("on");

  $("name").classList.remove("hide");

  $("auth").textContent = "Create account";

};


$("name").classList.add("hide");


$("auth").onclick = async () => {

  if(!sb){

    $("msg").textContent =
      "Add Supabase keys in config.js";

    return;

  }


  let e =
    $("email").value.trim();

  let p =
    $("pass").value;


  if(!e || !p){

    $("msg").textContent =
      "Please enter email and password.";

    return;

  }


  if(signup){

    let n =
      $("name").value.trim();


    let r =
      await sb.auth.signUp({

        email:e,

        password:p,

        options:{
          data:{
            full_name:n
          }
        }

      });


    $("msg").textContent =
      r.error?.message ||
      "Account created. Check email if confirmation is enabled.";

  }else{

    let r =
      await sb.auth.signInWithPassword({

        email:e,

        password:p

      });


    if(r.error){

      $("msg").textContent =
        r.error.message;

    }

  }

};


$("logout").onclick =
  () => sb.auth.signOut();


$("back").onclick =
  dash;


$("bb").onclick =
  dash;


$("pb").onclick =
  dash;


async function profile(){

  let r =
    await sb
      .from("profiles")
      .select("*")
      .eq("id",user.id)
      .single();


  return r.data;

}


async function dash(){

  show("home");


  let p =
    await profile();


  let n =
    p?.full_name ||
    user.email.split("@")[0];


  $("welcome").textContent =
    "Welcome, " + n + " 👋";


 $("best").textContent =
    p?.best_score !== null &&
    p?.best_score !== undefined
    ? `${p.best_score}/${p.best_total}`
    : "—";


  $("solved").textContent =
    p?.questions_solved || 0;


  $("correct").textContent =
    p?.correct_answers || 0;

}


function start(subject,isMock=false){

  mode =
    isMock
    ? "mock"
    : "practice";


  pool =
    qs
      .filter(q => isMock || q.subject === subject)
      .sort(() => Math.random()-.5)
      .slice(
        0,
        isMock
        ? Math.min(30,qs.length)
        : 20
      );


  if(!pool.length){

    alert(
      "No questions for this subject yet."
    );

    return;

  }


  idx = 0;

  chosen = null;

  correct = 0;

  solved = 0;


  $("exname").textContent =
    isMock
    ? "Mock Exam"
    : subject;


  show("exam");

  render();

}


function render(){

  let q =
    pool[idx];


  $("prog").textContent =
    `${idx+1}/${pool.length}`;


  $("qn").textContent =
    `QUESTION ${idx+1}`;


  $("qt").textContent =
    q.question;


  $("bar").style.width =
    (idx/pool.length*100) + "%";


  $("fb").textContent = "";


  $("next").disabled = true;


  $("opts").innerHTML =
    q.options
      .map(
        (o,i) =>
        `<button
          class="option"
          data-i="${i}">
          ${String.fromCharCode(65+i)}. ${o}
        </button>`
      )
      .join("");


  document
    .querySelectorAll(".option")
    .forEach(
      b =>
      b.onclick =
      () => answer(+b.dataset.i)
    );

}


function answer(i){

  if(chosen !== null)
    return;


  chosen = i;

  solved++;


  let q =
    pool[idx];


  let ok =
    i === q.answer;


  if(ok)
    correct++;


  document
    .querySelectorAll(".option")
    .forEach(
      (b,j) => {

        b.disabled = true;


        if(j === q.answer)
          b.classList.add("correct");


        if(j === i && !ok)
          b.classList.add("wrong");

      }
    );


  $("fb").textContent =
    ok
    ? "✅ Correct!"
    : "❌ Incorrect — correct answer: " +
      q.options[q.answer];


  $("next").disabled = false;

}


$("next").onclick =
  async () => {

    if(idx < pool.length-1){

      idx++;

      chosen = null;

      render();

    }else{

      let p =
        await profile();


     let newBest =
  Number(p?.best_score || 0);

if (Number(correct) > newBest) {
  newBest = Number(correct);
}

      const updateResult =
        await sb
          .from("profiles")
          .update({

            best_score:newBest,

            best_total:pool.length,

            questions_solved:
              (p?.questions_solved || 0)
              + solved,

            correct_answers:
              (p?.correct_answers || 0)
              + correct

          })
          .eq("id",user.id);

      if(updateResult.error){

        alert(
          "Profile update error: " +
          updateResult.error.message
        );

        console.error(
          "PROFILE UPDATE ERROR:",
          updateResult.error
        );

        return;
      }
          


$("mock").onclick =
  () => start(null,true);


$("random").onclick =
  () =>
  start(
    subjects[
      Math.floor(
        Math.random()*subjects.length
      )
    ]
  );


$("board").onclick =
  async () => {

    show("boardview");


    let r =
      await sb
        .from("profiles")
        .select(
          "full_name,best_score,best_total"
        )
        .order(
          "best_score",
          {ascending:false}
        )
        .limit(100);


    $("list").innerHTML =
      (r.data||[])
      .map(
        (p,i) =>
        `<div class="row">

          <div class="rank">
            ${
              i<3
              ? ["🥇","🥈","🥉"][i]
              : "#"+(i+1)
            }
          </div>

          <div>
            <b>${p.full_name}</b>
          </div>

          <div class="score">
            ${p.best_score}/${p.best_total}
          </div>

        </div>`
      )
      .join("");

  };


$("profile").onclick =
  async () => {

    show("profileview");


    let p =
      await profile();


    $("pbox").innerHTML =
      `<h2>
        ${p?.full_name||"Student"}
      </h2>

      <p class="muted">
        ${user.email}
      </p>

      <hr>

      <p>
        🏆 Best:
        <b>
          ${p?.best_score||0}/${p?.best_total||600}
        </b>
      </p>

      <p>
        📝 Solved:
        <b>
          ${p?.questions_solved||0}
        </b>
      </p>

      <p>
        ✅ Correct:
        <b>
          ${p?.correct_answers||0}
        </b>
      </p>`;

  };


console.log("JS OK"); init();

