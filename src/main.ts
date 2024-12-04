import Graph from "./garph/graph";

const data1 = {
  title: "Hi! I'm Charles",
  subTitle: "web developer",
  photo: "/photo.webp",
  introduce: [
    "Front-end software Engineer with 2 years of experience creating responsive, user-friendly web applications. ",
    "Proficient in modern front-end technologies such as TypeScript and React, with a strong track record of collaborating with UX designers and back-end teams to deliver seamless user experiences. ",
  ],
  stacks: [
    {
      title: "Programming Language",
      list: [
        "HTML",
        "CSS",
        "JavaScript",
        "TypeScript",
        "nodeJS",
        "python",
        "rust",
      ],
    },
    {
      title: "Framework",
      list: ["reactJs", "nextJs", "tailwindcss", "actix-web"],
    },
    { title: "Tool", list: ["docker", "postgres", "mongodb"] },
  ],
  projects: [
    {
      name: "E-Commerce Platform",
      techniques: ["NextJs", "Express", "Actix-web", "Postgres"],
      githubUrl: "https://github.com/Charlesqu76/e-platform",
      description:
        "Buyers can explore recommended products tailored to their views or purchase history and receive AI-generated summary comments. Retailers can manage their products, track sales performance, access user insights, and consult with an AI agent for sales-related questions.",
      image: "/api/placeholder/800/600",
    },
    {
      name: "Daily Expense Recorder",
      techniques: ["Nextjs", "Postgres"],
      githubUrl: "https://github.com/Charlesqu76/expense.git",
      description:
        "An intuitive expense-tracking tool with data visualizations to provide actionable spending insights.",
      image: "/api/placeholder/800/600",
    },
    {
      name: "Supplier Management System",
      techniques: ["NextJs", "NestJs"],
      websiteUrl: "https://east-bay.cn/",
      description:
        "A React-based platform allowing users to manager product categories, track sales, and visualize historical sales date",
      image: "/api/placeholder/800/600",
    },
  ],
  experience: [
    {
      company: "Ctrip",
      role: "Frontend Software Engineer",
      techs: ["React", "Next.js", "Eggjs", "Mobx", "rematch", "React Native"],
      todo: [
        "Enhance and maintain the finance section of Ctrip Finance App using Next.js.",
        "Maintain and update the business logic in BFF layer.",
        "Optimize the performance of website, reduce LCP and CLS.",
      ],
      time: "November 2020 - August 2023",
    },
    {
      company: "Kuai Shou",
      role: "Software Development Intern",
      techs: ["React", "Mobx"],
      todo: [
        "Develop and maintain the Kdev backstage platform.",
        "Collaborate with backend developers to implement new features.",
      ],
      time: "July 2020 - September 2020 ",
    },
  ],
};

const data = {
  name: "charles",
  age: 18,
  hobbies: [{ name: "bed" }, { name: "basketball", level: 3 }],
  address: { city: "shanghai", street: "nanjing road" },
};

const main = () => {
  const graph = new Graph();

  graph.initCanvas("#app");
  graph.initData(data);
  graph.layout();

  if (graph.canvas === null) return;

  document.querySelector("#button")?.addEventListener("click", () => {
    console.log(graph.allChildrenBox().map((box) => box.value));
  });

  // new TextBox(graph.canvas, { x: 100, y: 100, text: "charles" }, graph);

  // const c = new ChildrenBox(
  //   graph.canvas,
  //   {
  //     x: 100,
  //     y: 100,
  //     width: 100,
  //     height: 100,
  //     config: { ActiveStrokeColor: "red" },
  //   },
  //   graph
  // );

  // graph.addChildBox(c);

  // const n = new KeyValueBox(
  //   graph.canvas,
  //   {
  //     x: 200,
  //     y: 200,
  //     key: "name",
  //     value: "charles",
  //   },
  //   graph
  // );

  // const n2 = new KeyValueBox(
  //   graph.canvas,
  //   {
  //     x: 200,
  //     y: 300,
  //     key: "name",
  //     value: "alice",
  //   },
  //   graph
  // );
};

main();
