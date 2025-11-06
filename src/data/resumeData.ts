export const resumeData = {
  name: "Aryan Dokania",
  title: "Software Engineer",
  contact: {
    phone: "+1 (925)750-0470",
    location: "San Diego, CA",
    email: "aryandokania2001@gmail.com",
    linkedin: "linkedin.com/in/aryandokania",
    github: "github.com/imaryandokania",
    scholar: "scholar.google.com/citations?user=9TPRFwEAAAAJ&hl=en"
  },
  sections: {
    summary: [
      "Cloud-native software engineer with experience across large-scale networking, applied machine learning, and distributed systems.",
      "Focused on building reliable infrastructure, intelligent developer tooling, and high-availability services."
    ],
    education: [
      {
        university: "University of California San Diego",
        location: "San Diego, CA",
        degree: "Master of Science in Computer Science and Engineering",
        period: "Sept. 2024 - Dec. 2025",
        gpa: "GPA: 3.96/4.0"
      },
      {
        university: "Vellore Institute of Technology",
        location: "Vellore, India",
        degree: "Bachelor of Technology in Computer Science and Engineering",
        period: "July 2019 - April 2023",
        gpa: "CGPA: 9.4/10"
      }
    ],
    experience: [
      {
        title: "Software Engineer II Intern",
        company: "Cisco Systems",
        location: "Ann Arbor, MI",
        period: "June 2025 - Sept. 2025",
        points: [
          "Developed an LLM-based code reviewer using AWS Bedrock and a RAG pipeline with Titan embeddings to analyze pull requests for logic errors, security risks, and design issues.",
          "Implemented optimized FAISS vector search using AWS Lambda for scalable semantic search and batch embedding generation, reducing processing time by 58%.",
          "Built a logistic regression classifier on SBERT embeddings to evaluate LLM-generated code reviews, improving F1 score by 15% through data augmentation and hyperparameter tuning."
        ]
      },
      {
        title: "Researcher",
        company: "Spatiotemporal Machine Learning Lab (Prof. Rose Yu)",
        location: "San Diego, CA",
        period: "June 2024 - Sept. 2024",
        points: [
          "Built a PyTorch-based meta-learning optimizer with adaptive momentum and gradient scaling using a two-layer LSTM and MLP architecture, trained on GPU across 100+ optimization trajectories.",
          "Benchmarked the meta-optimizer on five unseen optimization trajectories, achieving faster convergence than gradient descent and LSTM-based baselines using learned momentum coefficients.",
          "Published at ICLR 2025: \"Improving Learning to Optimize Using Parameter Symmetries.\""
        ]
      },
      {
        title: "Associate Software Developer",
        company: "Oracle",
        location: "Bengaluru, India",
        period: "Aug. 2023 - June 2024",
        points: [
          "Upgraded the policy system's MySQL stack (v6.0 to v8.0), doubling replication speed and improving concurrency through InnoDB tuning and parallel replication.",
          "Containerized the Multi-Protocol Routing Agent and Policy Engine using Docker and Kubernetes, automating rollouts and reducing migration time by nearly 50%.",
          "Migrated a core service to Oracle Cloud Infrastructure with a CI/CD pipeline, cutting deployment time by 90% and improving release reliability.",
          "Improved VoLTE call-flow performance by profiling SIP/Diameter traffic and tuning thread pools and queue depths, reducing signaling latency during peak load."
        ]
      },
      {
        title: "Project Intern",
        company: "Oracle",
        location: "Bengaluru, India",
        period: "Jan. 2023 - July 2023",
        points: [
          "Designed a fault-tolerant network architecture and automated failover handling with Python routing logic, enabling high-availability services with ~2 ms recovery in 4G distributed infrastructure."
        ]
      }
    ],
    projects: [
      {
        title: "Distributed MPEG-DASH Video Streaming Platform",
        technologies: ["Go", "AWS S3", "AWS EC2", "SQLite", "REST API"],
        points: [
          "Developed a video streaming backend with HTTP endpoints for uploading and retrieving MPEG-DASH segments, supporting adaptive bitrate streaming.",
          "Designed distributed storage with chunked uploads on AWS S3 using SHA-256 consistent hashing and coordinated metadata across nodes with RAFT-based leader election on AWS EC2."
        ]
      },
      {
        title: "Intelligent gRPC Load Balancer",
        link: "https://github.com/imaryandokania/LoadBalancer",
        technologies: ["Go", "Prometheus", "Kubernetes", "Python"],
        points: [
          "Built a scalable gRPC load balancer on Kubernetes with three backend pods to enable real-time routing.",
          "Trained a linear regression model on Prometheus metrics to compute live pod scores, reducing tail latency by 35%."
        ]
      },
      {
        title: "LLM-Based JIRA Issue Search",
        link: "https://github.com/imaryandokania/SearchEngine",
        technologies: ["TypeScript", "Docker", "Python"],
        points: [
          "Developed a tool to retrieve similar JIRA issues and surface linked resolutions for new tickets.",
          "Fine-tuned LLaMA 3.1 on historical issue data to rank and link similar past tickets with detailed context.",
          "Containerized the backend with Docker and built a TypeScript front-end for search."
        ]
      }
    ],
    skills: {
      languages: ["C++", "C", "Java", "Go", "Python", "SQL", "JavaScript", "TypeScript", "Bash"],
      mlAi: ["PyTorch", "TensorFlow", "Scikit-learn", "XGBoost", "Hugging Face", "LangChain", "AI Agents"],
      cloudTools: [
        "AWS (EC2, S3, Bedrock, Lambda)",
        "GCP",
        "Oracle Cloud Infrastructure",
        "REST APIs",
        "Git",
        "Docker",
        "Kubernetes",
        "MySQL",
        "MongoDB",
        "gRPC"
      ],
      certifications: [
        {
          name: "AI Certification",
          link: "https://drive.google.com/file/d/1IM3w4l7EMDbjPw-LNdsm08_Etiy5SZg3/view?usp=sharing"
        },
        {
          name: "NLP Certification",
          link: "https://coursera.org/share/98c7233c870ae2ed0b1a843ee7840260"
        },
        {
          name: "UNIX and Linux Certification",
          link: "https://drive.google.com/file/d/1P5ZbUVSF2zocQBsKVcLQEafTJvBAq4vj/view?usp=sharing"
        }
      ],
      coursework: [
        "Database Systems",
        "Computer Networks",
        "Operating Systems",
        "Machine Learning",
        "Distributed Systems"
      ]
    },
    achievements: [
      {
        title: "SPOT Award",
        description: "Recognized at Oracle for outstanding engineering performance."
      },
      {
        title: "Merit Scholarships",
        description: "Awarded scholarships for academic excellence in 2021, 2022, and 2023.",
        links: [
          "https://drive.google.com/file/d/1tpcuvjg4dUV7OKPnBoYHUY5Lmw714FR4/view?usp=share_link",
          "https://drive.google.com/file/d/1tWpVBqV4fi2Brqe1fVq3kJ_vHFzgmsss/view?usp=share_link",
          "https://drive.google.com/file/d/1AmbNINUbuMSymKhOt-PamwOWQc0rI3VL/view?usp=share_link"
        ]
      }
    ],
    research: [
      {
        title: "Improving Learning to Optimize Using Parameter Symmetries",
        authors: ["Guy Zamir", "Aryan Dokania", "Bo Zhao", "Rose Yu"],
        venue: "ICLR",
        year: "2025",
        link: "https://arxiv.org/abs/2504.15399"
      },
      {
        title: "Enhanced Grammar Error Detection and Correction Using Hybrid Algorithm",
        authors: ["Aryan Dokania", "Aditya Bamb", "A. M. Lal"],
        venue: "Innovations in Power and Advanced Computing Technologies (i-PACT)",
        year: "2023",
        link: "https://ieeexplore.ieee.org/document/10224909"
      },
      {
        title: "Secure File Sharing System Using Hybrid Authentication and Secured Key",
        authors: ["Aryan Dokania", "Aditya Bamb", "J. Dheeba"],
        venue: "Intelligent System and Data Analysis: SSIC 2023 Doctoral Symposium",
        year: "2023",
        link: "https://link.springer.com/chapter/10.1007/978-3-031-57897-2_36"
      }
    ]
  }
};
