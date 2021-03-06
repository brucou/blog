'use strict'

const Even = {}

// NOT USED : we use manis hugo theme instead for the go up functionality
Even.backToTop = function () {
  const $backToTop = $('#back-to-top')

  $(window).scroll(function () {
    if ($(window).scrollTop() > 100) {
      $backToTop.fadeIn(1000)
    } else {
      $backToTop.fadeOut(1000)
    }
  })

  $backToTop.click(function () {
    $('body,html').animate({ scrollTop: 0 })
  })
}

// NOT USED : we use manis hugo theme instead for the go up functionality
Even.mobileNavbar = function () {
  const $mobileNav = $('#mobile-navbar')
  const $mobileNavIcon = $('.mobile-navbar-icon')
  const slideout = new Slideout({
    'panel': document.getElementById('mobile-panel'),
    'menu': document.getElementById('mobile-menu'),
    'padding': 180,
    'tolerance': 70
  })
  slideout.disableTouch()

  $mobileNavIcon.click(function () {
    slideout.toggle()
  })

  slideout.on('beforeopen', function () {
    $mobileNav.addClass('fixed-open')
    $mobileNavIcon.addClass('icon-click').removeClass('icon-out')
  })

  slideout.on('beforeclose', function () {
    $mobileNav.removeClass('fixed-open')
    $mobileNavIcon.addClass('icon-out').removeClass('icon-click')
  })

  $('#mobile-panel').on('touchend', function () {
    slideout.isOpen() && $mobileNavIcon.click()
  })
}

Even._initToc = function () {
  const SPACING = 20
  const $toc = $('.post-toc')
  const $footer = $('footer.container')

  if ($toc.length) {
    const minScrollTop = $toc.offset().top - SPACING
    const maxScrollTop = $footer.offset().top - $toc.height() - SPACING

    // Ugly modification to have content navbar fixed all the time, and not follow the page
    const tocState = {
      start: {
        'position': 'fixed',
        'top': SPACING
      },
      process: {
        'position': 'fixed',
        'top': SPACING
      },
      end: {
        'position': 'fixed',
        'top': SPACING
      }
    }

    $(window).scroll(function () {
      const scrollTop = $(window).scrollTop()

      if (scrollTop < minScrollTop) {
        $toc.css(tocState.start)
      } else if (scrollTop > maxScrollTop) {
        $toc.css(tocState.end)
      } else {
        $toc.css(tocState.process)
      }
    })
  }

  const HEADERFIX = 30
  const $toclink = $('.toc-link')
  const $headerlink = $('.headerlink')

  const headerlinkTop = $.map($headerlink, function (link) {
    return $(link).offset().top
  })

  $(window).scroll(function () {
    const scrollTop = $(window).scrollTop()

    for (let i = 0; i < $toclink.length; i++) {
      const isLastOne = i + 1 === $toclink.length
      const currentTop = headerlinkTop[i] - HEADERFIX
      const nextTop = isLastOne ? Infinity : headerlinkTop[i + 1] - HEADERFIX

      if (currentTop < scrollTop && scrollTop <= nextTop) {
        $($toclink[i]).addClass('active')
      } else {
        $($toclink[i]).removeClass('active')
      }
    }
  })
}

Even.fancybox = function () {
  if ($.fancybox) {
    $('.post-content').each(function () {
      $(this).find('img').each(function () {
        $(this).wrap(`<a class="fancybox" href="${this.src}" data-fancybox="gallery" data-caption="${this.title}"></a>`)
      })
    })

    $('.fancybox').fancybox({
      selector: '.fancybox',
      protect: true
    })
  }
}

Even.highlight = function () {
  const blocks = document.querySelectorAll('pre code')
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const rootElement = block.parentElement
    const lineCodes = block.innerHTML.split(/\n/).slice(0, -1)
    const lineLength = lineCodes.length

    let codeLineHtml = ''
    for (let i = 0; i < lineLength; i++) {
      codeLineHtml += `<div class="line">${i + 1}</div>`
    }

    let codeHtml = ''
    for (let i = 0; i < lineLength; i++) {
      codeHtml += `<div class="line">${lineCodes[i]}</div>`
    }

    block.className += ' highlight'
    const figure = document.createElement('figure')
    figure.className = block.className
    figure.innerHTML = `<table><tbody><tr><td class="gutter"><pre>${codeLineHtml}</pre></td><td class="code"><pre>${codeHtml}</pre></td></tr></tbody></table>`

    rootElement.parentElement.replaceChild(figure, rootElement)
  }
}

Even.toc = function () {
  const tocContainer = document.getElementById('post-toc')
  if (tocContainer !== null) {
    const toc = document.getElementById('TableOfContents')
    if (toc === null) {
      // toc = true, but there are no headings
      tocContainer.parentNode.removeChild(tocContainer)
    } else {
      this._refactorToc(toc)
      this._linkToc()
      this._initToc()
    }
  }
}

Even._refactorToc = function (toc) {
  const oldTocList = toc.children[0]
  let newTocList = oldTocList
  let temp
  while (newTocList.children.length === 1 && (temp = newTocList.children[0].children[0]).tagName === 'UL')
    newTocList = temp

  if (newTocList !== oldTocList)
    toc.replaceChild(newTocList, oldTocList)
}

Even._linkToc = function () {
  const links = document.querySelectorAll('#TableOfContents a')
  for (let i = 0; i < links.length; i++) links[i].className += ' toc-link'

  for (let num = 1; num <= 6; num++) {
    const headers = document.querySelectorAll('.post-content>h' + num)
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      header.innerHTML = `<a href="#${header.id}" class="headerlink" title="${header.innerHTML}"></a>${header.innerHTML}`
    }
  }
}

$(document).ready(function () {
//  Even.backToTop()
//  Even.mobileNavbar()
  Even.toc()
//  Even.fancybox()
})
