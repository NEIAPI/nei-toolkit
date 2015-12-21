# Xcode Project File 添加删除文件规则

## 一 概述
本文档描述在Xcode Project File中添加和删除文件的规则，这些规则初步只限定于源文件(.m)和头文件(.h); 暂时不涉及资源文件、不涉及Framework文件；不涉及静态库文件.

与添加源文件和头文件相关的Section包括：

+ PBXBuildFile
+ PBXFileReference
+ PBXGroup
+ PBXSourcesBuildPhase

添加删除文件必须在解析工程的基础上，与解析工程相关的Section包括：

+ PBXNativeTarget
+ PBXProject

所有Section的描述可以参看文档[Xcode Project File Format](xcode_project_file_format.md).

文中提到的key或者uuid都指该Element的唯一Id, 为一个24字节的字符串; 所有的操作都需要先找到对应的Key，然后查询得到指定的对象，并对对象进行操作; 所有规则的实现优先考虑本地目录路径与Group路径对应的情况.

## 二 文件修改的影响
请参见文档：以添加Models为例，Models中包含两个文件，HTTestModel.h与HTTestModel.m; 添加到根Group下，则工程文件会发生如下变动：
### 1 PBXFileReference Section
在PBXFileReference Section中添加文件所对应的记录;

	/* Begin PBXFileReference section */
			E6B03C081C28173D00450E9E /* HTTestModel.h */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.c.h; path = HTTestModel.h; sourceTree = "<group>"; };
			E6B03C091C28173D00450E9E /* HTTestModel.m */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.c.objc; path = HTTestModel.m; sourceTree = "<group>"; };
	/* End PBXFileReference section */
	
### 2 PBXGroup Section
在PBXGroup Section中主要有两个变化：

+ 新增了一个Group，叫做Models, Models的`children`所包含的是新增的PBXFileReference的uuid
+ 新增的Group Models加到了parent Group `HTProductName`的`children`中.

End.
	
	/* Begin PBXGroup section */
			E6A5578D1C22979700A81AD5 /* HTProductName */ = {
				isa = PBXGroup;
				children = (
					E6B03C071C28173D00450E9E /* Models */,
				);
				path = HTProductName;
				sourceTree = "<group>";
			};
			E6B03C071C28173D00450E9E /* Models */ = {
				isa = PBXGroup;
				children = (
					E6B03C081C28173D00450E9E /* HTTestModel.h */,
					E6B03C091C28173D00450E9E /* HTTestModel.m */,
				);
				path = Models;
				sourceTree = "<group>";
			};
	/* End PBXGroup section */
	
### 3 PBXBuildFile Section

在PBXBuildFile Section中新增了一项，该项的fileRef为新增的PBXFileReference的uuid.

	/* Begin PBXBuildFile section */
			E6B03C0A1C28173D00450E9E /* HTTestModel.m in Sources */ = {isa = PBXBuildFile; fileRef = E6B03C091C28173D00450E9E /* HTTestModel.m */; settings = {ASSET_TAGS = (); }; };
	/* End PBXBuildFile section */	
	
### 4 PBXSourcesBuildPhase Section

在默认Target的PBXSourcesBuildPhase的files中新增了一项, 该项的uuid `E6B03C0A1C28173D00450E9E`即为新增的`PBXBuildFile`的uuid.

	/* Begin PBXSourcesBuildPhase section */
		E6A557871C22979700A81AD5 /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				E6A557931C22979700A81AD5 /* AppDelegate.m in Sources */,
				E6B03C0A1C28173D00450E9E /* HTTestModel.m in Sources */,
				E6A557901C22979700A81AD5 /* main.m in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
	/* End PBXSourcesBuildPhase section */
	

## 三 搜索规则
### 规则1 根据路径搜索Group
1 遍历`PBXGroup` Section所有项目，获取到所有Group信息并构建成Hash表；
2 从`PBXProject` Section中找到`mainGroup`, 该Group为Root Group.
3 从Root Group开始，遍历子节点(Children)的信息，如果子节点是Group(即步骤1中Hash表能够找到对应项)，则结合Group信息的Hash表构建Group的树结构；
4 根据路径和树结构搜索到指定的Group; 得到Group Key与Group对象.

Note：虽然Group是一个明显的树形结构，但开源库node-xcode似乎并没有构建一个树形结构出来, 只是根据PBXGroup维护了一个哈希表; 
个人建议同时维护树的结构和哈希表；哈希表可以帮助通过Key找到Group信息；树的结构则可以协助通过路径来找到Key; 如果性能客观，建议树形结构中包含所有的文件信息，这样方便搜索文件与Group.

### 规则2 根据Group Key与文件名搜索文件
1 从解析得到的Group Hash表中根据Key查询到Group信息；(Group信息获取参见`规则1`)
2 遍历`PBXFileReference` Section得到文件信息(PBXFileReference)的哈希表;
3 遍历Group的Childrens, 取出每一个Key, 在文件信息表中查询得到文件对象并且比较该文件的文件名是否匹配(如果文件信息表中没有文件名，则用path匹配)， 如果匹配，则找到该文件，得到该文件对应的PBXFileReference Key.

### 规则3 根据文件全路径得到PBXFileReference Key
Note: 该规则的实现可以暂缓或者仅实现简单版本，一般情况下，不支持根据全路径名来得到文件的Key.
简单版本：
1 根据文件所在的文件夹路径，按照规则1搜索Group;
2 根据搜索到的Group名和步骤1得到的Group Key，按照规则2搜索到文件；

简单版本要求工程的Group与文件目录完全一致，否则经常会找不到文件；

复杂版本：
1 根据规则1的步骤1～3构建Group的Tree;
2 根据规则2的步骤1～3将PBXFileReference加到Group的Tree中得到完整的树形结构；在构建完整的树形结构中根据每一个叶子节点的路径得到每个文件的完整路径；
3 遍历完整的树形结构，根据全路径找到对应的节点.

复杂版本要求构建完整的树形结构.

## 四 添加规则

### 规则4 添加某个文件到指定Key的Group
已知：目标Group的Key, 文件相对Group所在目录的相对路径.
1 按照规则2搜索Group;
2 创建PBXFileReference对象，name为文件名，path为文件相对Group所在目录的相对路径.
3 将该PBXFileReference对象添加到Group的children中；
4 如果该文件为源文件，创建一个PBXBuildFile对象，该对象的fileRef为步骤2所创建的PBXFileReference对象的uuid; 将PBXBuildFile对象添加到工程的PBXBuildFile Section中；否则添加完毕.
5 在步骤4的基础上，找到`PBXSourcesBuildPhase` Section, 在`files`中添加一项, 值为步骤4所创建的`PBXBuildFile`对象的uuid.

### 规则5 将文件夹作为一个Group添加到工程
已知：Parent Group路径，文件夹相对于parent group所在目录的路径； 通常用于将某个文件夹添加到所在父文件夹所对应的Group.
1 按照规则1搜索Parent Group;
2 如果Parent Group不存在，按照本规则添加Parent Group到工程中; 然后继续本规则添加当前文件夹;
3 如果Parent Group存在，则新建一个Group, Group的path为该文件夹相对parent Group的路径，添加到parent Group的children中；
4 根据规则4将文件夹下的所有文件添加到新建的Group中去；

### 规则6 添加文件到指定路径的Group 
已知：目标Group路径, 文件相对Group所在目录的相对路径path. 通常用于将某个文件添加到所在文件夹对应的Group.

1 按照规则1搜索目标Group;
2 如果Group不存在，则新生成一个PBXGroup对象，添加parent path对应的Group中；
3 按照规则4将文件添加到指定的Group中；

### 添加规则的要点总结
1 首先找到Group; 一般用户给出的参数是Group路径，需要根据路径找到Group对象或者Group Key;
2 Group不存在时需要创建；
3 文件在添加到Group时一定要同时添加到PBXFileReference.
4 源文件需要添加到`PBXSourcesBuildPhase`与`PBXBuildFile`.
5 TODO: 暂时只需要搜索默认Target的`PBXSourcesBuildPhase` section.
6 默认只添加.m与.h文件，需要允许指定有效文件列表、允许指定是否添加子文件夹。

## 五 删除规则

### 规则7 删除Group下某个文件
已知：目标Group的Key, 文件相对Group所在目录的相对路径. 一般用于删除某个Group下的某个文件.
1 按照规则2搜索到Group与对应的PBXFileReference对象;
2 从Group的Children中删除该PBXFileReference对象；
3 如果不是源文件，在`PBXFileReference` section中删除PBXFileReference对象；结束.
4 如果是源文件，遍历`PBXBuildFile` section, 找到待删除的`PBXFileReference`对象，得到对应的`PBXBuildFile`的key, 并且删除对应的`PBXBuildFile`记录；
5 根据得到的`PBXBuildFile`的key,在 `PBXSourcesBuildPhase`中的`files`下找到对应的fileRef, 并且删除该Element.

### 规则8 删除指定路径下Group的文件
已知：目标Group的路径, 文件相对Group所在目录的相对路径. 一般用于删除某个Group下的某个文件.
1 按照规则1根据Group路径搜索到指定的Group;
2 根据规则7删除该文件.

### 规则9 删除某个Group
已知：目标Group路径.
1 根据规则1搜索到目标Group与目标Group的Parent Group;
2 如果目标Group不存在，给出警告并结束；
3 如果目标Group存在，遍历Group里的所有项目；
4 从Group的Children中删除该项目;
5 如果某一项是Group, 按照本规则删除这个Group;
6 如果某一项是文件，那么在`PBXFileReference` section中删除PBXFileReference对象；
7 在步骤6的基础上，如果是源文件，遍历`PBXBuildFile` section, 找到待删除的`PBXFileReference`对象，得到对应的`PBXBuildFile`的key, 并且删除对应的`PBXBuildFile`记录；
8 在步骤7的基础上，根据得到的`PBXBuildFile`的key,在 `PBXSourcesBuildPhase`中的`files`下找到对应的fileRef, 并且删除该Element.
9 在步骤1中所找到的Parent Group的Children中，删除当前的Group;
10  从步骤1所获取到的Group List中，删除当前的Group.

### 删除规则的要点总结
1 需要事先解析出Group的树形结构与PBXFileReference的树形结构，便于根据路径搜索到指定的Group;
2 与添加文件对应，对于源文件，必须从`PBXSourcesBuildPhase`与`PBXBuildFile`中删除指定记录.
3 TODO: 理论上，删除文件需要处理所有的Target, 针对现有的需求，暂时只需要搜索默认Target的`PBXSourcesBuildPhase` section.


## 六 更新规则
文件内容的更新不涉及到Project File的改动；更新规则主要描述一个文件夹中的文件发生了变化，例如文件有增加或者删除或者改名情况下，如果更新到工程中。
为了简单起见，只考虑文件夹与Group一一对应的情况，不考虑一个文件夹与多个Group对应的情况.

更新规则更符合当前的需求，将Models与Requests文件夹添加到指定的Group下；如果已经存在，则更新Group下文件；如果不存在，则添加文件到该Group下.

### 规则10 更新文件夹到指定Group下
1 根据规则1搜索到Parent Group, 文件夹对应的目标Group;
2 如果目标Group 不存在，则根据规则5添加文件夹到Parent Group下，结束.
3 如果目标Group存在，根据删除规则删除该Group下所有文件；
4 根据规则4，遍历文件夹，将文件夹下有效文件(.m,.h)添加到目标Group下；

### 规则11 按需更新文件夹
1 根据文件夹路径和搜索规则搜索到文件夹所对应的Group;
2 遍历文件夹，判断文件是否新增，如果是，则添加到Group中；
3 在遍历的过程中，标记Group中所有找到的文件；
4 对于Group中所有未标记的文件和文件夹，删除；

具体应用哪种规则取决于具体的实现；规则10实现更简单粗暴，但可能带来不必要的更新与删除；规则11实现起来稍微麻烦。可先实现规则10.