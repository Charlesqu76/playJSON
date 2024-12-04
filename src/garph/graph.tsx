// src/main.ts
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.panzoom.js";

import ObjectBox from "./ObjectBox";
import { bfs } from "./bfs";
import React, { useEffect, useRef } from "react";
import { Svg } from "@svgdotjs/svg.js";

// Set viewBox to ensure content is visible

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

export class GG {
  canvas: Svg | null = null;
  node: ObjectBox | null = null;
  constructor() {}

  initCanvas = (id: string) => {
    this.canvas = SVG()
      .addTo(id)
      .size("100%", "100%")
      .viewbox("0 0 1000 1000")
      .panZoom({ zoomMin: 0.1, zoomMax: 2 });
  };

  initData = (data: Object) => {
    if (!this.canvas) return;
    this.node = new ObjectBox(this.canvas, {
      x: 100,
      y: 100,
      value: data,
      gg: this,
    });
  };

  layout = () => {
    if (!this.node) return;
    bfs(this.node);
  };
}

const Graph = () => {
  const canvas = useRef(new GG());
  useEffect(() => {
    canvas.current.initCanvas("#graph");
    canvas.current.initData(data);
    canvas.current.layout();
  }, []);
  return (
    <div>
      <button
        onClick={() => {
          canvas.current.layout();
        }}
      >
        click
      </button>
      <div id="graph" className="bg-slate-300"></div>
    </div>
  );
};

export default Graph;
