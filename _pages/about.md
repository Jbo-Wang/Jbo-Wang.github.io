---
permalink: /
title: ""
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

I am Jingbo Wang (王境博 in Chinese), a third-year undergraduate student at South China University of Technology (SCUT). Currently, I am an intern at the Hong Kong University of Science and Technology (Guangzhou), under the supervision of [Haoang Li](https://sites.google.com/view/haoangli/homepage). I also work closely with [Wenxuan Song](https://songwxuan.github.io/) and [Han Zhao](https://h-zhao1997.github.io/), whose guidance and support have been invaluable to my research.

**Goal**: Pushing the boundaries of the world through robotics.

**Email**: guangtouchangkaishen@outlook.com

---

## Selected Publications

{% for post in site.publications reversed limit: 1 %}
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

## Educations
**South China University of Technology** | *2023 - 2027* |  Computer Science (Full English Teaching), Bachelor

