<?xml version="1.0" encoding="UTF-8"?>
<x:stylesheet xmlns:x="http://www.w3.org/1999/XSL/Transform"
	version="1.0">

	<x:template match="widget[@type='notFound']" mode="widget">
		<x:copy-of select="$langdoc/notFound/node()"/><br/>
		<x:if test="$role='admin'">
			<a href="/admin-new_view/{//view/@name}"><x:value-of select="$langdoc//notFoundAdmin"/></a>
		</x:if>
	</x:template>

	<x:template name="menu">
		<li class="yui3-menuitem">
			<a class="yui3-menuitem-content" href="{@url}">
				<x:value-of select="$langdoc/menu/*[local-name()=current()/@name]"/>
			</a>
		</li>
	</x:template>

	<x:template match="widget[@type='menuButton']" mode="widget">
		<x:attribute name="class">widget acenv-menuButton <x:value-of select="@class"/></x:attribute>
		<a class="acenv-menuButton-trigger" href="label/{@url}"><x:copy-of select="label/node()"/></a>
		<div class="acenv-menuButton-content hide ">
			<x:for-each select="content/*">
				<x:call-template name="template">
					<x:with-param name="dataSource" select="@dataSource"/>
				</x:call-template>
			</x:for-each>
		</div>
	</x:template>

	<x:template match="widget[@type='menu']" mode="widget">
		<x:attribute name="class">widget yui3-menu acenv-menu <x:value-of select="@class"/></x:attribute>
		<x:variable name="accesskey" select="@accesskey"/>
		<div class="yui3-menu-content">
		<ul>
			<x:for-each select="*">
				<x:variable name="pos" select="position()=1"/>
				<li class="yui3-menuitem">
					<x:choose>
						<x:when test="local-name()='stop'">|</x:when>
						<x:when test="count(item)">
							<a class="yui3-menu-label" href="#{@name}">
								<x:if test="position()=1">
									<x:attribute name="accesskey"><x:value-of select="$accesskey"/></x:attribute>
								</x:if>
								<x:value-of select="$langdoc/menu/*[local-name()=current()/@name]"/>
							</a>
							<div id="{@name}" class="yui3-menu yui3-menu-hidden">
								<div class="yui3-menu-content">
									<ul>
										<x:for-each select="item">
											<x:call-template name="menu"/>
										</x:for-each>
									</ul>
								</div>
							</div>
						</x:when>
						<x:otherwise>
							<a class="yui3-menuitem-content" href="{@url}">
								<x:if test="position()=1">
									<x:attribute name="accesskey"><x:value-of select="$accesskey"/></x:attribute>
								</x:if>
								<x:value-of select="$langdoc/menu/*[local-name()=current()/@name]"/>
							</a>
						</x:otherwise>
					</x:choose>
				</li>
			</x:for-each>
		</ul>
		</div>
	</x:template>

	<x:template match="widget[@type='paginate']" mode="widget">
		<x:variable name="offset" select="@offset"/>
		<x:variable name="limit" select="@limit"/>
		<x:variable name="q" select="@quantity"/>
		<x:variable name="pages" select="ceiling($q div $limit)+1"/>
		<x:if test="$limit &lt; $q">
			<x:if test="$offset+1 &gt; $limit">
				<span class="previous"><a href="/{//view/@name}/{$offset -$limit}/{$limit}"><x:value-of select="$langdoc//previousPage/node()"/></a></span>
			</x:if>
			<x:for-each select="(//node()|//@*)[position() &lt; $pages]">
				<x:choose>
					<x:when test="position()=floor($offset div $limit)+1">
						<span class="current"><x:value-of select="position()"/></span>
					</x:when>
					<x:otherwise>
						<a class="number" href="/{//object[@name='acr:view']/@path}/{(position()-1)*$limit}/{$limit}"><x:value-of select="position()"/></a>
					</x:otherwise>
				</x:choose>
			</x:for-each>
			<x:if test="$q - $offset &gt; $limit">
				<span class="next"><a href="/{//object[@name='acr:view']/@path}/{$offset+$limit}/{$limit}"><x:value-of select="$langdoc/nextPage/node()"/></a></span>
			</x:if>
		</x:if>
	</x:template>

	<x:template match="widget[@type='selectLang']" mode="widget">
		<ul>
			<x:for-each select="//object[@name='acf:lang']/*">
				<li>
					<x:choose>
						<x:when test="local-name()=//object[@name='acf:lang']/@current">
							<img alt="{local-name()}" src="http://e.acimg.eu/flags/{local-name()}.png"/>
						</x:when>
						<x:otherwise>
							<a href="/functions/changeLang/{local-name()}"><img alt="{local-name()}" src="http://e.acimg.eu/flags/{local-name()}.png"/></a>
						</x:otherwise>
					</x:choose>
				</li>
			</x:for-each>
		</ul>
	</x:template>

	<x:template match="widget[@type='siteMap']" mode="widget">
		<x:variable name="dataSource" select="//*[local-name()=current()/@dataSource]"/>
		<x:variable name="width" select="99.9 div count($dataSource/category)"/>
		<x:for-each select="$dataSource/category">
			<div class="block" style="width:{$width}%;">
				<h3><x:value-of select="$langdoc//*[local-name()=current()/@langElement]"/></h3>
				<ul>
					<x:for-each select="item">
						<li><a href="{@link}"><x:value-of select="$langdoc//*[local-name()=current()/@langElement]"/></a></li>
					</x:for-each>
				</ul>
			</div>
		</x:for-each>
		<div style="clear:both;"/>
	</x:template>

	<x:template match="widget[@type='image']" mode="widget">
		<img src="{url}" alt="{alt}"/>
	</x:template>

	<x:template match="widget[@type='debug']" mode="widget">
		<x:if test="count(//debug)">
			<h1>Debug information</h1>
			<h2>Execution Log</h2>
			<table>
				<thead><td>Severity</td><td>Origin</td><td>File</td><td>Message</td></thead>
				<x:for-each select="//debug/executionLog/item">
					<tr class="{@level}"><td><x:value-of select="@level"/></td><td><x:value-of select="@origin"/></td><td><x:value-of select="@file"/>[<x:value-of select="@line"/>]</td><td><x:value-of select="message"/></td></tr>
				</x:for-each>
			</table>
			<h2>Info</h2>
			<div class="info"><x:copy-of select="//debug/info"/></div>
		</x:if>
	</x:template>

<!-- template execution order is not deterministic -->
	<x:template match="widget[@type='template']|widget[not(@type)]" name="templateWidget" mode="widget">
		<x:param name="dataSource" select="@dataSource"/>
		<x:choose>
			<x:when test="count(template)">
				<x:for-each select="template/*">
					<x:call-template name="template">
						<x:with-param name="dataSource" select="$dataSource"/>
					</x:call-template>
				</x:for-each>
			</x:when>
			<x:otherwise>
				<x:for-each select="*|text()">
					<x:call-template name="template">
						<x:with-param name="dataSource" select="$dataSource"/>
					</x:call-template>
				</x:for-each>
			</x:otherwise>
		</x:choose>
	</x:template>

	<x:template match="widget[@type='wiki']" mode="widget">
		<x:param name="dataSource" select="@dataSource"/>
		<x:if test="not($dataSource/permalink)">
			<x:copy-of select="$langdoc//noArticle/node()"/>
		</x:if>
		<x:if test="$role='admin'">
			<div class="yui3-cssreset accms-optionsPanel">
				<x:choose>
					<x:when test="$dataSource/permalink">
						<a class="edit" href="#permalink-{$dataSource/permalink}"/>
					</x:when>
					<x:otherwise>
						<a class="add" href="#permalink-{@realm}"/>
					</x:otherwise>
				</x:choose>
			</div>
		</x:if>
		<x:call-template name="templateWidget">
			<x:with-param name="dataSource" select="$dataSource"/>
		</x:call-template>
	</x:template>

	<x:template match="widget[@type='text']" mode="widget">
		<x:param name="dataSource" select="@dataSource"/>
		<x:variable name="text" select="$dataSource/*[@name='items']/*[name()=current()/@item]"/>
		<x:if test="@editable='true'">
			<div class="acenv-widget-settings">
				<a class="pageName" href="#{$dataSource/pageName}"/>
				<a class="itemName" href="#{@item}"/>
				<a class="id" href="#{$dataSource/_id}"/>
			</div>
			<x:if test="not($text)">
				<x:copy-of select="$langdoc//noText/node()"/>
			</x:if>
		</x:if>
		<x:copy-of select="$text/node()"/>
	</x:template>

	<x:template match="widget[@type='richText']" mode="widget">
		<x:param name="dataSource" select="@dataSource"/>
		<x:variable name="richText" select="$dataSource/*[@name='items']/*[name()=current()/@item]"/>
		<x:if test="@editable='true'">
			<div class="accms-optionsPanel">
				<a class="edit" href="#link-{$dataSource/pageName}/{@item}/{//*[@name='acr:view']/@path},{$dataSource/pageName}"/>
			</div>
			<x:if test="not($richText)">
				<x:copy-of select="$langdoc//noText/node()"/>
			</x:if>
		</x:if>
		<x:copy-of select="$richText/node()"/>
	</x:template>

	<x:template match="widget[@type='image']" mode="widget">
		<x:param name="dataSource" select="@dataSource"/>
		<x:variable name="url">
			<x:for-each select="url/node()">
				<x:call-template name="template">
					<x:with-param name="dataSource" select="$dataSource"/>
				</x:call-template>
			</x:for-each>
		</x:variable>
		<x:if test="@editable='true'">
			<div class="accms-optionsPanel">
				<a class="edit" href="#link-{$dataSource/pageName}/{@item}/{//*[@name='acr:view']/@path},{$dataSource/pageName}"/>
			</div>
		</x:if>
		<img>
			<x:attribute name="src"><x:value-of select="$url"/></x:attribute>
			<x:attribute name="alt">
				<x:for-each select="alt/node()">
					<x:call-template name="template">
						<x:with-param name="dataSource" select="$dataSource"/>
					</x:call-template>
				</x:for-each>
			</x:attribute>
		</img>
	</x:template>

</x:stylesheet>
