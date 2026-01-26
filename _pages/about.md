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
<div style="display: flex; gap: 20px; margin-bottom: 30px; align-items: flex-start;">

  <!-- 左边: teaser 图片 -->
  {% if post.header.teaser %}
  <div style="flex: 0 0 300px;">
    {% if post.paperurl %}
    <a href="{{ post.paperurl }}" target="_blank">
    {% endif %}
      <img src="{{ post.header.teaser | prepend: '/images/' }}" alt="{{ post.title }}" style="width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    {% if post.paperurl %}
    </a>
    {% endif %}
  </div>
  {% endif %}

  <!-- 右边: 标题和作者 -->
  <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
    <h3 style="margin: 0 0 15px 0; font-size: 1.4em;">
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

    {% if post.header.authors %}
      <p style="margin: 0; color: #586069; font-size: 1em;">{{ post.header.authors }}</p>
    {% endif %}
  </div>

</div>
{% endfor %}

---

## Educations
**South China University of Technology** | *2023 - 2027* | Computer Science (Full English Teaching), Bachelor

