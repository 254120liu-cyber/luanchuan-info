export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto p-4 py-8">
      <div className="bg-white rounded-2xl p-6 border-2 border-[var(--navy)]" style={{ boxShadow: '6px 6px 0px rgba(30,39,46,0.1)' }}>
        <h1 className="text-2xl font-extrabold text-[var(--navy)] text-center mb-6">隐私政策</h1>
        <div className="text-sm text-[var(--navy)] leading-relaxed space-y-4">
          <section>
            <h3 className="font-bold mb-2">一、信息收集</h3>
            <p>本平台在您注册时会收集邮箱地址用于账号标识。发布信息时，您提供的联系方式（电话、微信号）和所在区域将随信息一起公开展示。</p>
          </section>
          <section>
            <h3 className="font-bold mb-2">二、信息使用</h3>
            <p>用户发布的信息将公开显示在平台中，供其他用户浏览和联系。我们不会将您的信息用于任何其他商业用途或分享给第三方。</p>
          </section>
          <section>
            <h3 className="font-bold mb-2">三、信息存储</h3>
            <p>发布的信息在过期后（72小时）将不再公开展示。收藏信息存储在您的账号中，仅您本人可见。</p>
          </section>
          <section>
            <h3 className="font-bold mb-2">四、举报与审核</h3>
            <p>如果您发现不当信息，可以举报。管理员审核后会根据情况删除信息并对发布者进行相应处理。</p>
          </section>
          <section>
            <h3 className="font-bold mb-2">五、用户权利</h3>
            <p>您可以随时编辑或删除自己发布的信息。如需注销账号，请联系管理员。</p>
          </section>
          <section>
            <h3 className="font-bold mb-2">六、联系方式</h3>
            <p>如有隐私相关问题，请联系管理员微信号：LC2543778683。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
