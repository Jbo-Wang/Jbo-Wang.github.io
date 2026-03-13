---
permalink: /
title: ""
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

I am Jingbo Wang (王境博 in Chinese), a third-year undergraduate student at South China University of Technology (SCUT). Currently, I am an intern at the Hong Kong University of Science and Technology (Guangzhou), under the supervision of [Haoang Li](https://sites.google.com/view/haoangli/homepage). I am also a research assistant at AIR, Tsinghua University. I work closely with [Wenxuan Song](https://songwxuan.github.io/) and [Han Zhao](https://h-zhao1997.github.io/), whose guidance and support have been invaluable to my research.

**Goal**: Pushing the boundaries of the world through robotics.

**Email**: guangtouchangkaishen@outlook.com

---

## Selected Publications
<p style="margin: 2px 0 0 0; color: #888; font-size: 0.8em; font-style: italic;">
    * Equal contribution
  </p>
{% for post in site.publications reversed limit: 2 %}
<div style="display: flex; gap: 25px; margin-bottom: 30px; align-items: flex-start;">

  <!-- 左边: teaser 图片 -->
  {% if post.teaser %}
  <div style="flex: 0 0 280px;">
    {% if post.paperurl %}
    <a href="{{ post.paperurl }}" target="_blank">
    {% endif %}
      <!-- 修改点：添加了更明显的阴影 box-shadow -->
      <img src="{{ post.teaser | prepend: '/images/' }}" alt="{{ post.title }}" 
           style="width: 100%; border-radius: 8px; box-shadow: 0 6px 16px rgba(0,0,0,0.15); display: block;">
    {% if post.paperurl %}
    </a>
    {% endif %}
  </div>
  {% endif %}

  <!-- 右边: 标题和作者 -->
  <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-start;">
    <!-- 修改点：标题字体调小 (1.15em)，行高压缩 -->
    <h3 style="margin: 0 0 10px 0; font-size: 1.15em; line-height: 1.3;">
      {% if post.paperurl %}
        <a href="{{ post.paperurl }}" target="_blank" style="color: #0366d6; text-decoration: none;">
          {{ post.title }}
        </a>
      {% else %}
        <a href="{{ post.url }}" style="color: #0366d6; text-decoration: none;">
          {{ post.title }}
        </a>
      {% endif %}
    </h3>

    {% if post.authors %}
      <!-- 作者字体也稍微调小了一点点 -->
      <p style="margin: 0; color: #586069; font-size: 0.95em;">{{ post.authors }}</p>
    {% endif %}

    {% if post.venue %}
      <p style="margin: 5px 0 0 0; color: #24292e; font-size: 0.9em; font-weight: 500;">
        {{ post.venue }}
      </p>
    {% endif %}
  </div>

</div>
{% endfor %}

---

## Education

<div style="display: flex; align-items: center; gap: 20px; margin-top: 20px; background: #f9f9f9; padding: 15px; border-radius: 10px;">
  
  <!-- 学校 Logo (请确保 images 文件夹下有 scut_logo.png) -->
  <div style="flex: 0 0 60px;">
    <img src="/images/scut.jpg" alt="SCUT Logo" style="width: 60px; height: 60px; object-fit: contain;">
  </div>

  <!-- 教育详情 -->
  <div style="flex: 1;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <span style="font-weight: bold; font-size: 1.1em; color: #222;">South China University of Technology (SCUT)</span>
      <span style="font-size: 0.9em; color: #666; font-style: italic;">Sept. 2023 - June 2027 (Expected)</span>
    </div>
    
    <div style="margin-top: 5px; color: #444;">
      Bachelor of Engineering in Computer Science (Full English Teaching Class)
    </div>

    <!-- GPA 标签排版 -->
    <div style="margin-top: 8px; display: flex; gap: 10px;">
      <span style="background: #eef4ff; color: #0366d6; padding: 2px 10px; border-radius: 15px; font-size: 0.85em; font-weight: 500; border: 1px solid #d0e1fd;">
        GPA: 3.92 / 4.0  <!-- 这里填入你的真实 GPA -->
      </span>
      <span style="background: #fff; color: #555; padding: 2px 10px; border-radius: 15px; font-size: 0.85em; border: 1px solid #ddd;">
        Rank: 2/34
      </span>
    </div>
  </div>
</div>

## Experience

<div style="margin-bottom: 25px;">
  <div style="display: flex; justify-content: space-between; align-items: baseline;">
    <span style="font-weight: 600; font-size: 1.1em; color: #222;">Tsinghua University</span>
    <span style="font-size: 0.9em; color: #666; font-style: italic;">Feb. 2026 - Present</span>
  </div>
  <div style="margin-top: 5px; display: flex; align-items: center; gap: 8px;">
    <span style="background: #eef4ff; color: #0366d6; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600;">Research Assistant</span>
    <span style="color: #444; font-size: 0.95em;">@ <a href="https://yanwang202199.github.io/" target="_blank" style="color: #0366d6; text-decoration: none;">AI Industry Research (AIR)</a></span>
  </div>
  <div style="margin-top: 8px; color: #444; font-size: 0.95em; line-height: 1.5;">
    <strong>Research Topic:</strong> World Models <br>
    <strong>Advisor:</strong> Prof. <a href="https://yanwang202199.github.io/" target="_blank" style="color: #0366d6; text-decoration: none;">Yan Wang</a>
  </div>
</div>

<div style="margin-bottom: 25px;">
  <div style="display: flex; justify-content: space-between; align-items: baseline;">
    <span style="font-weight: 600; font-size: 1.1em; color: #222;">HKUST (Guangzhou)</span>
    <span style="font-size: 0.9em; color: #666; font-style: italic;">July. 2025 - Present</span>
  </div>
  <div style="margin-top: 5px; display: flex; align-items: center; gap: 8px;">
    <span style="background: #eef4ff; color: #0366d6; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600;">Research Assistant</span>
    <span style="color: #444; font-size: 0.95em;">@ <a href="https://sites.google.com/view/haoangli/homepage" target="_blank" style="color: #0366d6; text-decoration: none;">Intelligent Robot Perception and Navigation Lab</a></span>
  </div>
  <div style="margin-top: 8px; color: #444; font-size: 0.95em; line-height: 1.5;">
    <strong>Research Topic:</strong> VLA <br>
    <strong>Advisor:</strong> Prof. <a href="https://sites.google.com/view/haoangli/homepage" target="_blank" style="color: #0366d6; text-decoration: none;">Haoang Li</a>
  </div>
</div>

<div style="margin-bottom: 25px;">
  <div style="display: flex; justify-content: space-between; align-items: baseline;">
    <span style="font-weight: 600; font-size: 1.1em; color: #222;">National Undergraduate Training Program for Innovation </span>
    <span style="font-size: 0.9em; color: #666; font-style: italic;">May. 2025 - Present</span>
  </div>
  <div style="margin-top: 5px; display: flex; align-items: center; gap: 8px;">
    <span style="background: #eef4ff; color: #0366d6; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600;">Project Leader</span>
    <!-- <span style="color: #444; font-size: 0.95em;">@ <a href="[网址]" target="_blank" style="color: #0366d6; text-decoration: none;">[实验室或课题组]</a></span> -->
  </div>
  <div style="margin-top: 8px; color: #444; font-size: 0.95em; line-height: 1.5;">
    <strong>Research Topic:</strong> Deep Learning-based Surgical Instrument Recognition System <br>
    <!-- <strong>Advisor:</strong> Prof. <a href="[网址]" target="_blank" style="color: #0366d6; text-decoration: none;">[导师姓名]</a> -->
  </div>
</div>

## Honors & Awards

<ul style="list-style: none; padding-left: 0; margin-top: 15px;">
  
  <!-- 奖项 1 -->
  <li style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px;">
    <!-- <span style="font-size: 1.2em; line-height: 1.2;">🥇</span> -->
    <div>
      <span style="font-weight: 500; color: #222;">The First Price Scholarship (twice)</span>
      <span style="color: #666; font-size: 0.9em; margin-left: 5px;">2024, 2025</span>
      <!-- 重点高亮标签 -->
      <!-- <span style="background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; margin-left: 6px; font-weight: 500;">
        [亮点数据，例如: 5k RMB, Top 2%]
      </span> -->
    </div>
  </li>

</ul>