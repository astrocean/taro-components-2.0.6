import 'weui'
import Nerv from 'nervjs'
import classNames from 'classnames'
import Swipers from 'swiper'

import 'swiper/dist/css/swiper.min.css'
import './style/index.scss'

let INSTANCE_ID = 0

class SwiperItem extends Nerv.Component {
  render () {
    const { className, style, itemId, children, ...restProps } = this.props
    const cls = classNames('swiper-slide', className)
    return <div
      className={cls}
      style={style}
      item-id={itemId}
      {...restProps}>
      {this.props.children}
    </div>
  }
}

const createEvent = type => {
  let e
  try {
    e = new TouchEvent(type)
  } catch (err) {
    e = document.createEvent('Event')
    e.initEvent(type, true, true)
  }
  return e
}

class Swiper extends Nerv.Component {
  constructor () {
    super(...arguments)
    this.$el = null
    this._id = INSTANCE_ID + 1
    INSTANCE_ID++
    this._$current = 0
    this.state={};
  }

  componentDidMount () {
    this.reInitSwiper(this.props);
  }

  componentWillReceiveProps (nextProps) {
    this.reInitSwiper(nextProps);
  } 
  componentWillUnmount () {
    this.$el = null
    if (this.mySwiper) this.mySwiper.destroy()
  }
  componentDidUpdate(){
    if(this.mySwiper&&this.shouldUpdateSwiper){
      this.updateSwiper();
      this.shouldUpdateSwiper=false;
    }
  }
  updateSwiper(){
    this.updateSWiperTimer&&clearTimeout(this.updateSWiperTimer);
    this.updateSWiperTimer=setTimeout(()=>{
      if(this.mySwiper){
        if(this.mySwiper.params&&this.mySwiper.params.loop){
          this.mySwiper.loopDestroy();
          this.mySwiper.loopCreate();
        }
        this.mySwiper.update();
      }
    },200);
   
  }
  
  reInitSwiper(props){
    const {
      autoplay = false,
      interval = 5000,
      duration = 500,
      current = 0,
      displayMultipleItems = 1,
      vertical,
      circular=false,
      spaceBetween,
      noSwipingClass,
      indicatorColor, 
      indicatorActiveColor,
      indicatorDots,
      className,
      style, 
      previousMargin, 
      nextMargin
    } = props

    let currentPropsStr=JSON.stringify({
      autoplay,
      current,
      interval,
      duration,
      displayMultipleItems,
      vertical,
      circular,
      spaceBetween,
      noSwipingClass,
    });

    let currentStatePropsStr=JSON.stringify({
      indicatorColor, 
      indicatorActiveColor,
      indicatorDots,
      className,
      style, 
      vertical, 
      previousMargin, 
      nextMargin
    });

    if(currentStatePropsStr!==this._$lastStateProps){
      this._$lastStateProps=currentStatePropsStr;
      this.setState({
        paginationCls:classNames(
          'swiper-pagination',
          {
            'swiper-pagination-hidden': !indicatorDots,
            'swiper-pagination-bullets':indicatorDots
          }
        ),
        defaultIndicatorColor : indicatorColor || 'rgba(0, 0, 0, .3)',
        defaultIndicatorActiveColor : indicatorActiveColor || '#000',
        cls : classNames(`taro-swiper-${this._id}`, className),
        sty :Object.assign({
          paddingTop: vertical ? this.parsePX(previousMargin) : 0,
          paddingRight: vertical ? 0 : this.parsePX(nextMargin),
          paddingBottom: vertical ? this.parsePX(nextMargin) : 0,
          paddingLeft: vertical ? 0 : this.parsePX(previousMargin),
          overflow: 'hidden'
        }, style)
      });
    }
    

    if(currentPropsStr===this._$lastProps){
      // this.updateSwiper();
      return;
    }
    
    let direction= vertical ? 'vertical' : 'horizontal';
    let slidesPerView=parseFloat(displayMultipleItems, 10);
    let speed= parseInt(duration, 10);
    if(this.mySwiper){
      let diffProps={};
      let notInitParams=['vertical','displayMultipleItems','duration','spaceBetween','current']
      let shouldInit=false;
      try{
        let lastProps=JSON.parse(this._$lastProps||'{}');
        let currentProps=JSON.parse(currentPropsStr);
        diffProps=Object.entries(currentProps).filter(([prop,value])=>{
          return lastProps[prop]!==value;
        }).reduce((currentObj,[prop,value])=>{
          currentObj[prop]=value;
          shouldInit=!notInitParams.includes(prop);
          return currentObj;
        },{});
        
      }catch(e){
  
      }

      if(!shouldInit){
        if('vertical' in diffProps){
          this.mySwiper.changeDirection(direction);
        }
        if('displayMultipleItems' in diffProps){
          this.mySwiper.params.slidesPerView=slidesPerView;
        }
        if('duration' in diffProps){
          this.mySwiper.params.speed=speed;
        }
        if('spaceBetween' in diffProps){
          this.mySwiper.params.spaceBetween=spaceBetween;
        }
        if('current' in diffProps){
          // 是否衔接滚动模式
          if (circular) {
            if (!this.mySwiper.isBeginning && !this.mySwiper.isEnd) {
              this.mySwiper.slideToLoop(parseInt(current, 10)) // 更新下标
            }
          } else {
            this.mySwiper.slideTo(parseInt(current, 10)) // 更新下标
          }
        }
        this._$lastProps = currentPropsStr;
        return;
      }
    }

    this._$lastProps = currentPropsStr;

    const that = this
    const opt = {
      // 指示器
      pagination: { el: `.taro-swiper-${this._id} > .swiper-container > .swiper-pagination` },
      direction:direction,
      loop: circular,
      slidesPerView:slidesPerView,
      initialSlide: parseInt(current, 10),
      speed:speed,
      observer: true,
      observeSlideChildren:true,
      observeParents: true,
      on: {
        slideChange () {
          const e = createEvent('touchend')
          try {
            Object.defineProperty(e, 'detail', {
              enumerable: true,
              value: {
                current: this.realIndex
              }
            })
          } catch (err) {}
          that._$current = this.realIndex
          that.handleOnChange(e)
        },
        transitionEnd: () => {
          const e = createEvent('touchend')
          try {
            Object.defineProperty(e, 'detail', {
              enumerable: true,
              value: {
                current: this.mySwiper.realIndex
              }
            });
          } catch (err) {}
          that.handleOnAnimationFinish(e)
        },
        observerUpdate: (e) => {
          if(this.$el===e.target){
            this.shouldUpdateSwiper=true;
          }
          
          if (e.target 
            && e.target.className === 'taro_page' 
            && e.target.style.display === 'block' 
            && e.target.contains(this.$el)
            ) {
            if (this.props.autoplay) {
              setTimeout(() => {
                this.mySwiper.slideTo(this._$current)
              }, 1000)
            }
          }
        }
      }
    }

    // 自动播放
    if (autoplay) {
      opt.autoplay = {
        delay: parseInt(interval, 10),
        stopOnLastSlide: false,
        disableOnInteraction: false
      }
    }

    // 两端距离
    if (spaceBetween) {
      opt.spaceBetween = spaceBetween
    }

    if(noSwipingClass){
      opt.noSwiping = true;
      opt.noSwipingClass = noSwipingClass;
    }

    if(this.mySwiper){
      this.mySwiper.destroy(true,true);
    }

    this.mySwiper = new Swipers(this.$el, opt);
    this.shouldUpdateSwiper=true;
  }

  handleOnChange (e) {
    const func = this.props.onChange
    typeof func === 'function' && func(e)
  }

  handleOnAnimationFinish (e) {
    const func = this.props.onAnimationFinish
    typeof func === 'function' && func(e)
  }

  parsePX (s = '0px') {
    return parseFloat(s.replace(/r*px/i, ''), 10)
  }

  render () {
    const {
      paginationCls,
      defaultIndicatorColor,
      defaultIndicatorActiveColor,
      cls,
      sty
    }=this.state;

    return (
      <div className={`swiper-container-wrapper ${cls}`} style={sty}>
        <div 
          className='swiper-container' 
          style={{ overflow: 'visible' }} 
          ref={(el) => { this.$el = el }}>
          <div
            dangerouslySetInnerHTML={{
              __html: `<style type='text/css'>
              .taro-swiper-${this._id} > .swiper-container > .swiper-pagination > .swiper-pagination-bullet { background: ${defaultIndicatorColor} }
              .taro-swiper-${this._id} > .swiper-container > .swiper-pagination > .swiper-pagination-bullet-active { background: ${defaultIndicatorActiveColor} }
              </style>`
            }}
          />
          <div className='swiper-wrapper'>{this.props.children}</div>
          <div className={paginationCls} />
        </div>
      </div>
    )
  }
}

export { Swiper, SwiperItem }